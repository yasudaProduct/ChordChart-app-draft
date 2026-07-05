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
pnpm test          # テスト実行（1回実行）
pnpm test:watch    # テスト実行（ウォッチモード）
```

## データベース操作

```bash
pnpm db:generate   # スキーマ変更後にマイグレーションファイルを生成
pnpm db:migrate    # マイグレーション適用（ステージングは CI が自動実行）
pnpm db:push       # DBに直接反映（ローカル開発向け）
pnpm db:seed       # 全テーブルをリセットして開発・テスト用データを投入（破壊的）
pnpm db:seed:demo  # デモ曲のみを冪等に投入（非破壊・ステージングは CI が自動実行）
```

> **注意:** `db:seed` は実行前にスキーマ内の全テーブルをリセットするため、開発・テスト環境専用。
> ステージング・本番のデモデータ投入には、実データを削除しない `db:seed:demo` を使う。
> デモ曲の定義は `src/db/demoSongs.ts` で両 seed 共通管理。

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

| メソッド | パス                   | 認証             | 説明                           |
| -------- | ---------------------- | ---------------- | ------------------------------ |
| GET      | `/api/health`          | 不要             | ヘルスチェック                 |
| GET      | `/api/songs`           | 不要             | 公開曲一覧                     |
| GET      | `/api/songs/demo`      | 不要             | デモ用曲一覧                   |
| GET      | `/api/songs/search?q=` | オプション       | 公開曲検索                     |
| GET      | `/api/songs/:id`       | オプション       | 曲詳細                         |
| POST     | `/api/songs`           | 必須             | 曲作成                         |
| PUT      | `/api/songs/:id`       | 必須             | 曲更新                         |
| PATCH    | `/api/songs/:id`       | 必須             | 曲の部分更新（公開範囲の変更） |
| DELETE   | `/api/songs/:id`       | 必須             | 曲削除                         |
| GET      | `/api/songs/:id/share` | 必須             | 共有リンク取得（所有者のみ）   |
| POST     | `/api/songs/:id/share` | 必須             | 共有リンク発行（所有者のみ）   |
| DELETE   | `/api/songs/:id/share` | 必須             | 共有リンク失効（所有者のみ）   |
| GET      | `/api/shares/:token`   | 不要             | 共有トークンから曲を取得       |
| GET      | `/api/me/summary`      | 必須             | 自分の曲数（可視性別集計）     |
| GET      | `/api/me/songs`        | 必須             | 自分の曲一覧                   |
| POST     | `/api/webhooks/clerk`  | 不要（署名検証） | Clerk Webhook（ユーザー同期）  |
