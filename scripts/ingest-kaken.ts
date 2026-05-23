import "dotenv/config";

/**
 * KAKEN（科研費）API からの取り込み（実装は後で）。
 * 利用には NII の開発者登録で取得する「アプリケーションID（appid）」が必要。
 * .env に KAKEN_APP_ID="..." を追加してから実行する。
 */

const APP_ID = process.env.KAKEN_APP_ID;

if (!APP_ID) {
  console.error("KAKEN_APP_ID が .env に設定されていません。");
  console.error(
    "NII の開発者登録（CiNii と共通: https://support.nii.ac.jp/ja/cinii/api/developer 等）でアプリ ID を取得し、",
  );
  console.error('.env に KAKEN_APP_ID="..." を追加してから再実行してください。');
  process.exit(1);
}

// TODO: KAKEN API（OpenSearch 形式）から取得する実装。
//   - 審査区分（生命科学系）で課題を検索
//   - 課題（grants）と研究代表者（labs）を抽出
//   - prisma.lab.upsert / prisma.grant.create で投入
console.log(`KAKEN ingest stub. APP_ID set (len=${APP_ID.length}).`);
