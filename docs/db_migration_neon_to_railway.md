# Neon → Railway DB 移行手順

最終更新：2026-05-25
対象：MVP データを Neon PostgreSQL から Railway PostgreSQL（Hobby $5/月）へ移す手順。

## 背景

`docs/技術設計書.md` 当初は Neon 採用だが、コスト方針（年 $500 以内、フェーズ2移行時に Vercel Pro + Neon Pro で $500 超過の懸念）から
Railway Hobby（5GB, $60/年）にスケジュール早期に切り替える。

DB アクセスは Prisma 経由で抽象化されているため、`DATABASE_URL` の差し替えのみで動作する想定。
PostgreSQL 拡張（`pg_trgm` 等）は Railway でも標準サポートされる。

## 前提

- ローカルに `psql` / `pg_dump` / `pg_restore` がインストール済み
  - macOS: `brew install postgresql@16`（クライアントだけでよい）
- Neon の現行 `DATABASE_URL`（`.env` に保管済み）
- Railway のアカウントが作成済み（[railway.app](https://railway.app)）

## 手順

### 1. Railway で PostgreSQL を起動

1. Railway ダッシュボードで New Project → "Deploy PostgreSQL"
2. プラン：Hobby（$5/月）
3. 生成された接続情報の中で **`DATABASE_URL`**（PostgreSQL Connection URL）をコピー
4. `?sslmode=require` が末尾に付いていることを確認

### 2. Neon からダンプ取得

```bash
cd ~/Downloads/labmatch
NEON_URL="postgresql://...neon..."   # 現行の .env の DATABASE_URL
RAILWAY_URL="postgresql://...railway..."  # 上で取得した新URL

# Prisma 経由のスキーマは Step 4 で適用するため、データダンプのみ取得する
bash scripts/db-migrate-to-railway.sh dump "$NEON_URL"
# → ./neon-dump.dump が生成される
```

### 3. Railway にリストア

```bash
bash scripts/db-migrate-to-railway.sh restore "$RAILWAY_URL"
# → neon-dump.dump を Railway に流し込む
```

### 4. 未適用マイグレーションを Railway に適用

ローカルでスキーマ変更（`prisma/migrations/20260525120000_add_lab_report_and_soft_delete`）が
作成されているが Neon には未適用。Railway に切り替えてから一括適用する。

```bash
# .env の DATABASE_URL を Railway のものに書き換えてから:
npx prisma migrate deploy
# → 既存マイグレーション + 新規 add_lab_report_and_soft_delete が順に適用される
npx prisma generate
```

### 5. 検証

```bash
# テーブルが揃っているか
psql "$RAILWAY_URL" -c "\dt"
# → universities, labs, works, grants, fields, lab_fields, societies, lab_societies, lab_reports

# 行数比較
psql "$NEON_URL" -c "SELECT (SELECT COUNT(*) FROM labs) AS labs, (SELECT COUNT(*) FROM works) AS works;"
psql "$RAILWAY_URL" -c "SELECT (SELECT COUNT(*) FROM labs) AS labs, (SELECT COUNT(*) FROM works) AS works;"
# → 値が一致すること

# has_abstract が backfill されているか
psql "$RAILWAY_URL" -c "SELECT has_abstract, COUNT(*) FROM works GROUP BY has_abstract;"
# → abstract != NULL の件数だけ true、それ以外は false（migration.sql の UPDATE で backfill 済み）
```

### 6. アプリケーション切り替え

`.env` を更新：

```env
DATABASE_URL="postgresql://...railway..."
# Neon 側は当面残しておく（切り戻し用）
# DATABASE_URL_NEON_OLD="postgresql://...neon..."
```

ローカルで開発サーバーを起動して `/labs` `/labs/[id]` の動作を確認。

Vercel デプロイの場合は、Vercel ダッシュボードで `DATABASE_URL` 環境変数も
更新する（旧メモリ参照：未設定のため、初回設定タイミングで Railway URL を入れる）。

### 7. 切り戻し計画

- 切り替え後 1 週間は Neon DB を削除しない（無料枠なのでコスト負荷なし）
- 問題なければ 1 週間後に Neon プロジェクトを停止

## トラブル時の対処

| 症状 | 確認 |
|---|---|
| `pg_restore: error: could not execute query` | 拡張機能未インストールの可能性。`CREATE EXTENSION pg_trgm;` を Railway で先に実行 |
| 文字化け | `pg_dump`/`restore` 両方を `-F c`（カスタム形式）で固定する |
| `prisma migrate deploy` で「migration already applied」 | 過去マイグレーションがダンプに含まれている。`_prisma_migrations` テーブルを `TRUNCATE` して再 deploy |
| 行数が一致しない | ダンプ取得中に書き込みがあった可能性。アプリを停止してから再ダンプ |
