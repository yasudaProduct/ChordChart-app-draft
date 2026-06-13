# ChordBook Backend (Hono)

ChordBook のバックエンド API サーバー。Hono + Drizzle ORM + TypeScript で実装。

詳細なアーキテクチャは [docs/architecture/backend.md](../../docs/architecture/backend.md) を参照。

## 技術スタック

| カテゴリ       | 技術                      |
| -------------- | ------------------------- |
| フレームワーク | Hono                      |
| ORM            | Drizzle ORM (postgres.js) |
| バリデーション | Zod (@hono/zod-validator) |
| JWT検証        | jose (JWKS / Clerk)       |
| テスト         | Vitest                    |
| ビルド         | tsup                      |
| ランタイム     | Node.js 20+               |

## セットアップ

環境構築の全体手順は [README.md](../../README.md) を参照。環境変数の詳細は [docs/deployment/environments.md](../../docs/deployment/environments.md) を参照。

```bash
pnpm install
cp .env.example .env
# .env を編集して CLERK_ISSUER 等を設定
```

## コマンド

```bash
pnpm dev           # 開発サーバー起動（tsx watch, localhost:8080）
pnpm build         # 本番ビルド → dist/index.js
pnpm start         # 本番起動
pnpm test          # テスト実行（ウォッチモード）
pnpm test -- --run # テスト1回実行
```

## データベース操作

```bash
pnpm db:generate   # スキーマ変更後にマイグレーションファイルを生成
pnpm db:migrate    # マイグレーション適用（ステージングは CI が自動実行）
pnpm db:push       # DBに直接反映（ローカル開発向け）
pnpm db:seed       # 既存データを削除してシードデータ投入
```

> **注意:** `db:seed` は実行前にスキーマ内の全テーブルをリセットする。開発環境での使用を推奨。

## Docker

```bash
# ビルド
docker build -t chordbook-backend .

# 起動
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e CLERK_ISSUER=https://... \
  -e CLERK_WEBHOOK_SECRET=whsec_... \
  -e ALLOWED_ORIGINS=https://your-frontend.com \
  chordbook-backend
```

## API エンドポイント

詳細は [docs/api/endpoints.md](../../docs/api/endpoints.md) を参照。

| メソッド | パス                   | 認証             | 説明                          |
| -------- | ---------------------- | ---------------- | ----------------------------- |
| GET      | `/api/health`          | 不要             | ヘルスチェック                |
| GET      | `/api/songs`           | オプション       | 曲一覧                        |
| GET      | `/api/songs/search?q=` | オプション       | 曲検索                        |
| GET      | `/api/songs/:id`       | オプション       | 曲詳細                        |
| POST     | `/api/songs`           | 必須             | 曲作成                        |
| PUT      | `/api/songs/:id`       | 必須             | 曲更新                        |
| DELETE   | `/api/songs/:id`       | 必須             | 曲削除                        |
| POST     | `/api/webhooks/clerk`  | 不要（署名検証） | Clerk Webhook（ユーザー同期） |
