import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/db";
import { getAllUniversities, CATEGORY_LABEL } from "../lib/universities";
import { DONE_MIN_LABS, SMALL_INSTITUTION_LABS } from "../lib/ingest-thresholds";

// 前回実行時の「完了済み機関名」スナップショット。今回の差分（新規完了）を出すのに使う。
const STATE_PATH = path.resolve("output/progress-state.json");

function loadPrevCompleted(): string[] {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    return Array.isArray(raw.completed) ? raw.completed : [];
  } catch {
    return [];
  }
}

function saveCompleted(names: string[]) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      { updatedAt: new Date().toISOString(), completed: names },
      null,
      2,
    ),
  );
}

async function main() {
  const unis = await prisma.university.findMany({
    include: { _count: { select: { labs: { where: { deletedAt: null } } } } },
    orderBy: { name: "asc" },
  });
  const children = unis.filter((u) => u.parentId !== null);
  const DONE = DONE_MIN_LABS;
  const cfg = getAllUniversities();

  // config の 1 機関に対応する DB 上のラボ数。ingest-next.ts の
  // countLabsForConfigUni と同じ数え方＝日本語名(name)と英語名(nameEn)の
  // 両レコードを拾い、それぞれの子センター分も合算する。
  //
  // 旧実装は config の name と一致する DB parent 1 件しか見ていなかったため、
  // ingest が nameEn 側のレコードにラボを作った機関（理研 革新知能統合研究センター
  // など）を「未着手」と誤って残存側に並べていた。ingest-next は同じ機関を
  // 取り込み済みと判定して二度と選ばないので、レポートだけが永久に残り続ける。
  const recsByName = new Map<string, typeof unis>();
  for (const u of unis) {
    const arr = recsByName.get(u.name) ?? [];
    arr.push(u);
    recsByName.set(u.name, arr);
  }
  const childrenByParent = new Map<number, typeof unis>();
  for (const u of children) {
    if (u.parentId === null) continue;
    const arr = childrenByParent.get(u.parentId) ?? [];
    arr.push(u);
    childrenByParent.set(u.parentId, arr);
  }
  function labsForConfig(c: { name: string; nameEn: string }): number {
    const seen = new Set<number>();
    let total = 0;
    for (const n of [c.name, c.nameEn]) {
      for (const rec of recsByName.get(n) ?? []) {
        if (seen.has(rec.id)) continue;
        seen.add(rec.id);
        total += rec._count.labs;
        for (const ch of childrenByParent.get(rec.id) ?? []) {
          if (seen.has(ch.id)) continue;
          seen.add(ch.id);
          total += ch._count.labs;
        }
      }
    }
    return total;
  }

  const withLabs = cfg
    .map((c) => ({ ...c, labs: labsForConfig(c) }))
    .sort((a, b) => b.labs - a.labs);
  const completed = withLabs.filter((c) => c.labs >= DONE);
  // 完了ではあるが規模が小さい機関。分野追加で伸ばす余地があるので別枠で出す。
  const small = completed.filter((c) => c.labs < SMALL_INSTITUTION_LABS);

  const completedNames = completed.map((c) => c.name).sort();

  // 前回スナップショットとの差分＝今回新たに完了した大学。
  const prevCompleted = loadPrevCompleted();
  const isFirstSnapshot = prevCompleted.length === 0;
  const prevSet = new Set(prevCompleted);
  const newlyCompleted = completed.filter((c) => !prevSet.has(c.name));

  // config に登録済みだが未完了（＝DB のラボ数が DONE_MIN_LABS 未満）の残存機関。
  // 並びは ingest-next.ts の auto-pick と同じ順（大学が先、研究機関が後。
  // 区分内は worksCount 降順）にして、上から順に取り込まれると読めるようにする。
  const rank = (c: { category: string }) =>
    c.category === "research-institute" ? 1 : 0;
  const remaining = withLabs
    .filter((c) => c.labs < DONE)
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        ((b as { worksCount?: number }).worksCount ?? 0) -
          ((a as { worksCount?: number }).worksCount ?? 0),
    );

  const total = await prisma.lab.count({ where: { deletedAt: null } });
  const works = await prisma.work.count();
  const summarized = await prisma.lab.count({
    where: { deletedAt: null, aiSummary: { not: null } },
  });
  const tagged = await prisma.lab.count({
    where: { deletedAt: null, tags: { isEmpty: false } },
  });

  console.log("=================================");
  console.log("  ラボマッチ 取り込み進捗レポート");
  console.log(`  ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} JST`);
  console.log("=================================\n");
  console.log(`■ 取り込み完了済み (labs >= ${DONE}): ${completed.length}/${cfg.length} 機関 (${Math.round(100 * completed.length / cfg.length)}%)`);

  console.log(`\n■ 今回新たに完了した大学 (前回比)`);
  if (isFirstSnapshot) {
    console.log(`  （初回スナップショット。今回を基準として記録。次回から差分を表示）`);
  } else if (newlyCompleted.length === 0) {
    console.log(`  なし（前回から新規完了は 0 件）`);
  } else {
    for (const u of newlyCompleted) {
      console.log(`  ★ ${u.name.padEnd(22)} ${u.labs} labs`);
    }
  }

  console.log(`\n■ 残存 (未完了) 機関一覧: ${remaining.length} 件`);
  console.log(`  （並び順＝これから cron が取り込む順。大学が先、研究機関が後）`);
  for (const c of remaining) {
    const state = c.labs === 0 ? "未着手" : `部分 ${c.labs} labs`;
    const skip = c.skipAutoIngest ? " ※auto-pick 対象外" : "";
    console.log(
      `  ○ ${c.name.padEnd(22)} [${CATEGORY_LABEL[c.category]}] ${state}${skip}`,
    );
  }

  console.log(
    `\n■ 小規模で完了扱いの機関 (${DONE}〜${SMALL_INSTITUTION_LABS - 1} labs): ${small.length} 機関`,
  );
  for (const u of small) {
    console.log(`  · ${u.name.padEnd(22)} ${u.labs} labs`);
  }
  console.log(`\n■ 子センター (parent 付き、研究機関): ${children.length} 件`);
  for (const u of children.sort((a, b) => b._count.labs - a._count.labs).slice(0, 10)) {
    console.log(`  · ${u.name.slice(0, 55).padEnd(55)} ${u._count.labs} labs`);
  }
  console.log(`\n■ 全体統計`);
  console.log(`  ラボ総数:     ${total.toLocaleString()}`);
  console.log(`  論文総数:     ${works.toLocaleString()}`);
  console.log(`  AI 要約済み:  ${summarized.toLocaleString()} (${Math.round(100 * summarized / total)}%)`);
  console.log(`  タグ付き:     ${tagged.toLocaleString()} (${Math.round(100 * tagged / total)}%)`);
  console.log(`\n■ config に登録されている総数: ${cfg.length} 機関（大学 + 公的研究機関 + 学内研究所）`);
  console.log(`  残: ${remaining.length} 機関 (4 本/日 cron で約 ${Math.ceil(remaining.length / 4)} 日で完走)`);

  // 今回の完了済みセットを保存。次回の「新規完了」差分に使う。
  saveCompleted(completedNames);

  await prisma.$disconnect();
}
main();
