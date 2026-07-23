import { config } from "dotenv";
config({ override: true });
import { prisma } from "../lib/db";
import {
  getAllUniversities,
  type University,
} from "../lib/universities";
import { DONE_MIN_LABS } from "../lib/ingest-thresholds";
import { spawn } from "node:child_process";

/**
 * 自動 ingest スクリプト：
 *
 * config から「まだ十分に ingest されていない大学」を 1 校選び、
 * 既存の ingest-utokyo-life.ts を `--university=KEY` で呼び出す。
 *
 * 選定ロジック：
 *   1. 大学（国立・公立・私学）を先に、公的研究機関を後に。区分内は
 *      worksCount が大きい順（＝研究力順）
 *   2. ただし「すでに ingest されている」もの（DB の labs 数が
 *      DONE_MIN_LABS 以上）はスキップ
 *
 * このスクリプトは「1 校だけ」を ingest して終了する。
 * GitHub Actions などで cron 実行することを想定。
 *
 * 環境変数:
 *   - INGEST_NEXT_DRY_RUN=1 で対象選定のみ表示して終了
 *   - INGEST_NEXT_FORCE_KEY=u-tokyo で特定大学を強制指定
 */

interface CandidateInfo {
  university: University;
  currentLabCount: number;
}

/**
 * 完了判定用の lab 数。config の 1 機関に対応する DB 上の University レコードを
 * 日本語名(name)と英語名(nameEn)の両方で拾い、それぞれの子センター
 *（parentId が当該レコードを指す University）の lab も合算する。
 *
 * 理由 1：RIKEN のように PI が全員子センター（RIKEN Center for ...）に
 * 振り分けられる機関では、親レコード自体の lab 数が当時のしきい値 50 に届かず、
 * ingest-next が毎回その機関を選び直して無限ループしていた（2026-06-18 発覚）。
 *
 * 理由 2：ingest が nameEn 側のレコード（例 "RIKEN Center for Integrative
 * Medical Sciences" = 141 labs）にラボを作り、完了判定が name 側の空に近い
 * シャドウレコード（"理研 統合生命医科学研究センター" = 35 labs）だけを数えて
 * 50 に届かず、同じ機関を無限に選び直していた（2026-07-06 発覚）。name と
 * nameEn の両レコードを合算することで、この重複割れを完了扱いにする。
 */
async function countLabsForConfigUni(uni: University): Promise<number> {
  const names = [uni.name, uni.nameEn].filter(
    (n): n is string => typeof n === "string" && n.length > 0,
  );
  const recs = await prisma.university.findMany({
    where: { name: { in: names } },
    select: { id: true },
  });
  if (recs.length === 0) return 0;
  const ids = recs.map((r) => r.id);
  return prisma.lab.count({
    where: {
      deletedAt: null,
      OR: [
        { universityId: { in: ids } },
        { university: { parentId: { in: ids } } },
      ],
    },
  });
}

async function pickNextUniversity(): Promise<CandidateInfo | null> {
  // openalexInstitutionId が null の機関も含める（ingest-utokyo-life.ts の
  // 動的解決に任せる）。研究機関カテゴリの大半が当初 null で登録されているため、
  // 旧 filter のままだと 4 本 cron で自動取り込みされない問題があった。
  const all = getAllUniversities();

  // ソート順：大学（国立・公立・私学）を先に、研究機関を後に。
  // 同じ区分の中は worksCount 降順（worksCount 不明は最後）。
  //
  // 2026-07-23 のユーザー指示。サイトの利用者は大学院進学・研究室配属を考える学生で、
  // 探す対象はまず大学の研究室。産総研・NIMS・JAXA のような公的研究機関は
  // 需要が後に来るので、大学を全部埋めてから回す。
  // 取り込み済みの研究機関（理研 IMS・Kavli IPMU 等）はそのまま完了扱いで残す。
  const rank = (u: University) => (u.category === "research-institute" ? 1 : 0);
  const sorted = [...all].sort((a, b) => {
    const byCategory = rank(a) - rank(b);
    if (byCategory !== 0) return byCategory;
    const aw = (a as unknown as { worksCount?: number }).worksCount ?? 0;
    const bw = (b as unknown as { worksCount?: number }).worksCount ?? 0;
    return bw - aw;
  });

  // 「未着手（DB に lab が 0 件）」の機関だけを自動取り込みの対象にする。
  //
  // 旧ロジックは「lab < 50 の最初の機関」を返していた。しかし ingest は 1 回で
  // その分野の PI を出し尽くす単発処理なので、小規模機関（例: Kavli IPMU は
  // 生命+医療で 33 lab が上限）は何度取り込んでも 50 に届かない。すると毎 cron
  // で同じ機関を選び直し、それより研究力の低い未着手機関を永久に飛ばして
  // 進捗が止まる（2026-07-08 以降、本番 cron が Kavli IPMU で無言停止していた）。
  //
  // 対策：一度でも取り込まれた（lab≥1）が閾値未満の機関は「その分野では
  // 出し尽くし」とみなして自動選択から外し、未着手機関を研究力順に流す。
  // 出し尽くしの部分機関を後から伸ばしたいときは、config に分野を足したうえで
  // INGEST_NEXT_FORCE_KEY=<key> か `--fields=stem` で手動追い取り込みする。
  //
  // 2026-07-23 に DONE_MIN_LABS を 1 に下げたので、この「取り込んだが閾値未満」の
  // 区間は現在は空（lab≥1 は完了扱い）。しきい値を将来また上げたときのために
  // 分岐は残してある。
  const startedButUnfinished: { key: string; labs: number }[] = [];
  for (const uni of sorted) {
    // 別レコードで取り込み済みの重複機関などは明示的に除外する
    if (uni.skipAutoIngest) continue;
    const labCount = await countLabsForConfigUni(uni);
    if (labCount >= DONE_MIN_LABS) continue; // 取り込み済み
    if (labCount === 0) {
      // 未着手＝本来の自動取り込み対象。研究力の高い順で 1 校返す。
      return { university: uni, currentLabCount: 0 };
    }
    // 0 < labCount < DONE_MIN_LABS：着手済みだが閾値未満。ここでは選ばない。
    startedButUnfinished.push({ key: uni.key, labs: labCount });
  }

  if (startedButUnfinished.length > 0) {
    console.log(
      `No un-started institution left. Skipped partially-ingested (1-${DONE_MIN_LABS - 1} labs) ` +
        "institutions to avoid re-picking exhausted ones:",
    );
    for (const s of startedButUnfinished) {
      console.log(
        `  · ${s.key} (${s.labs} labs) — INGEST_NEXT_FORCE_KEY=${s.key} to retry ` +
          `(e.g. after adding fields, or --fields=stem backfill)`,
      );
    }
  }
  return null;
}

async function main() {
  const force = process.env.INGEST_NEXT_FORCE_KEY;
  const dryRun = process.env.INGEST_NEXT_DRY_RUN === "1";

  let target: CandidateInfo | null;
  if (force) {
    const uni = getAllUniversities().find((u) => u.key === force);
    if (!uni) {
      console.error(`Force key "${force}" not found in config`);
      process.exit(1);
    }
    const labCount = await countLabsForConfigUni(uni);
    target = { university: uni, currentLabCount: labCount };
  } else {
    target = await pickNextUniversity();
  }

  if (!target) {
    console.log("✓ All configured universities are already ingested.");
    await prisma.$disconnect();
    return;
  }

  console.log(
    `Selected: ${target.university.name} (key=${target.university.key}, current labs=${target.currentLabCount})`,
  );
  if (dryRun) {
    console.log("DRY RUN: not executing ingest.");
    await prisma.$disconnect();
    return;
  }

  const before = target.currentLabCount;
  await prisma.$disconnect();

  // 既存 ingest-utokyo-life.ts を子プロセスで呼ぶ。
  // 取り込む分野は「明示的に」固定する。ingest-utokyo-life.ts の CLI 既定は
  // 2026-07 に「全分野=18」へ変わったが、nightly cron（GitHub Actions）は
  // timeout-minutes:350 が生命＋医療の 7 分野を前提に組まれている。既定を暗黙
  // 継承すると 1 回の cron が 18 分野（2〜3倍の負荷）になり、タイムアウトで
  // 部分取り込みのまま「完了扱い」に固定される恐れがある。
  // よって cron は既定 life（従来挙動）に固定。理工系の追い取り込みは別途
  // --fields=stem を明示実行する。スコープを変えたい場合は INGEST_NEXT_FIELDS で。
  const fields = process.env.INGEST_NEXT_FIELDS || "life";
  console.log(`Spawning ingest-utokyo-life.ts (--fields=${fields})...`);
  const child = spawn(
    "npx",
    [
      "tsx",
      "scripts/ingest-utokyo-life.ts",
      `--university=${target.university.key}`,
      `--fields=${fields}`,
    ],
    { stdio: "inherit" },
  );
  child.on("exit", async (code) => {
    console.log(`\ningest exited with code ${code}`);

    // 進捗を計測する。取り込み後に lab が 1 件も増えていなければ「無言の停止」。
    // GitHub Actions を非ゼロ終了で赤にし、失敗メールで気づけるようにする
    // （全機関完了で pickNextUniversity が null を返す正常系は上で return 済みなので、
    //  ここに来るのは「機関を選んだのに増えなかった」異常系だけ）。
    let after = before;
    let countOk = true;
    try {
      after = await countLabsForConfigUni(target.university);
    } catch (e) {
      countOk = false;
      console.error("post-ingest lab count failed (skipping progress check):", e);
    } finally {
      await prisma.$disconnect();
    }
    const delta = after - before;
    if (countOk) {
      console.log(
        `Progress for ${target.university.key}: labs ${before} → ${after} ` +
          `(Δ${delta >= 0 ? "+" : ""}${delta})`,
      );
    }

    if (code && code !== 0) {
      process.exit(code);
    }
    // 進捗判定は lab 数の再計測に成功したときだけ行う。計測が転けたら
    // （DB 一時障害など）子プロセスの成否をそのまま尊重し、誤検知の赤を避ける。
    if (countOk && delta <= 0) {
      console.error(
        `\n⚠ NO PROGRESS: ${target.university.key} added 0 labs for the current ` +
          `field set. It has no ingestable data here — set skipAutoIngest:true in ` +
          `config/universities.json (or add fields), else every cron re-picks it. ` +
          `Exiting non-zero so this is visible in Actions.`,
      );
      process.exit(2);
    }
    process.exit(0);
  });
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
