# GitHub Actions による自動 ingest セットアップ

最終更新：2026-05-26

毎日 0:00〜9:00 JST に研究室を自動取り込みするための GitHub Actions セットアップ手順。

## 全体構成

```
.github/workflows/
├── nightly-ingest.yml   # 0:00 JST 起動、約 5-6 時間で 1 大学 ingest
└── hourly-monitor.yml   # 0:00-9:00 JST の毎時、DB 状態確認

scripts/
├── ingest-next.ts       # 自動で次の大学を選んで ingest
├── db-status.ts         # DB スナップショット出力
└── ingest-utokyo-life.ts (既存)  # ingest 本体
```

## セットアップ手順

### 1. ローカルの変更をコミット & push

```bash
cd ~/Downloads/labmatch
git add .
git commit -m "Add GitHub Actions for nightly ingest"
git push origin main
```

すでに `.env` は `.gitignore` 済み。安全。

### 2. GitHub リポジトリで Secrets を設定

リポジトリ画面 → Settings → Secrets and variables → Actions → **New repository secret** で以下 3 つを登録：

| Secret name | 値の取得元 |
|---|---|
| `DATABASE_URL` | `.env` の `DATABASE_URL`（Railway public URL） |
| `OPENALEX_API_KEY` | `.env` の `OPENALEX_API_KEY` |
| `ANTHROPIC_API_KEY` | `.env` の `ANTHROPIC_API_KEY` |

### 3. リポジトリの公開設定

GitHub Actions の無料枠：

- **Public repo**：無制限・無料
- **Private repo**：月 2,000 分まで無料、超過は $0.008/min

毎日 6 時間 ingest を 30 日続けると 180 時間 = 10,800 分。Private だと月 ~$70 課金。
**推奨：Public**（ソースコードのみ。Secrets は GitHub 側で暗号化されて入る）。

Settings → General → "Change repository visibility" → Public へ切替。

### 4. workflow を有効化

GitHub Actions タブを開いて、ワークフローが認識されていれば自動で cron が走る。
- 初回手動テスト：`Nightly Ingest` → "Run workflow" ボタンで即時起動可能。
- `force_key` 入力欄に大学キー（例：`kyoto-u`）を入れると特定大学を強制 ingest。

## 動作仕様

### nightly-ingest.yml

- **トリガー**：毎日 15:00 UTC（= 00:00 JST 翌日）
- **処理**：
  1. `scripts/db-status.ts` — 開始時の DB 状態をログ
  2. `scripts/ingest-next.ts` — config から「まだ ingest されていない最大の大学」を 1 校選び ingest
  3. `scripts/generate-summaries.ts` — 新規ラボの AI 要約生成（残時間内、失敗継続）
  4. `scripts/backfill-tags.ts --only-empty` — 新規ラボのタグ生成
  5. `scripts/db-status.ts` — 終了時の DB 状態をログ
- **タイムアウト**：350 分（GitHub Actions 単一 job 上限 6 時間直前）

### 大学の選定ロジック

`scripts/ingest-next.ts`：

- config 内の全大学を `worksCount` 降順でソート（メモリ確定の優先順位）
- 各大学の DB 内ラボ数を確認、**< 50 件のものを未 ingest とみなす**
- 最上位の未 ingest 大学を 1 つ選んで `ingest-utokyo-life.ts --university=KEY` で実行

### hourly-monitor.yml

- **トリガー**：00:00, 01:00, ..., 09:00 JST（毎時 00 分）
- **処理**：`scripts/db-status.ts` を実行、DB 状態を GitHub Actions ログに記録
- **タイムアウト**：5 分

ログは Actions タブの該当 run から確認可能。

## 運用イメージ（1 ヶ月後）

| 日数 | 完了する大学（例） |
|---|---|
| 7 | 京大、阪大、東北、名大、九大、北大、慶應 |
| 14 | + 早稲田、東工大、東医歯、筑波、神戸、広島、千葉 |
| 21 | + 横浜国立、大阪公立、都立、市立、東理大、順天堂、上智 |
| 30 | + Phase 6 上位（岡山、金沢、熊本、新潟、長崎、近畿） |
| 60 | Phase 6 全 25 校完了、Phase 7 へ |

## トラブル対応

| 症状 | 原因 | 対処 |
|---|---|---|
| `Timed out fetching a new connection` | DB 接続プール枯渇（複数 job 同時実行など） | `concurrency: nightly-ingest` で防止済み |
| `ANTHROPIC_API_KEY is not set` | Secrets 未設定 | Repository Settings で確認 |
| 6 時間で完走しない | 大学が大きすぎる | 当日分は途中まで、翌日 ingest 再開（upsert で冪等） |
| OpenAlex の API quota 超過 | 1 日 $1 枠超過 | 翌日リトライ。継続的に必要なら課金検討 |

## 手動コマンド（ローカル開発時）

```bash
# 次の大学を確認するだけ（DRY RUN）
INGEST_NEXT_DRY_RUN=1 npx tsx scripts/ingest-next.ts

# 特定大学を強制 ingest
INGEST_NEXT_FORCE_KEY=kyoto-u npx tsx scripts/ingest-next.ts

# DB 状態確認
npx tsx scripts/db-status.ts
```
