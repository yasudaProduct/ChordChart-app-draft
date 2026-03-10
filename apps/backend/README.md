# ChordBook Backend (Hono)

ChordBook のバックエンド API サーバー。Hono + Drizzle ORM + TypeScript で実装。

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Hono |
| ORM | Drizzle ORM (postgres.js) |
| バリデーション | Zod (@hono/zod-validator) |
| JWT検証 | jose (JWKS) |
| テスト | Vitest |
| ビルド | tsup |
| ランタイム | Node.js 20+ |

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd apps/backend
pnpm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、値を設定する。

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chordbook
SUPABASE_URL=https://your-project.supabase.co
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `DATABASE_URL` | PostgreSQL 接続文字列 | (必須) |
| `SUPABASE_URL` | Supabase プロジェクトURL | (必須) |
| `ALLOWED_ORIGINS` | CORS 許可オリジン（カンマ区切り） | `http://localhost:3000` |
| `PORT` | サーバーポート | `8080` |

#### ローカル Supabase を使う場合

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

## 開発

### 開発サーバー起動

```bash
pnpm dev
```

ファイル変更時に自動リロードされる（tsx watch）。

### ビルド

```bash
pnpm build
```

`dist/index.js` に ESM バンドルが出力される。

### 本番起動

```bash
pnpm start
```

### テスト

```bash
pnpm test          # ウォッチモード
pnpm test -- --run # 1回実行
```

## API エンドポイント

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/api/health` | 不要 | ヘルスチェック |
| GET | `/api/songs` | オプション | 曲一覧（認証時: 自分の曲、匿名: Public曲） |
| GET | `/api/songs/search?q=` | オプション | 曲検索（Public曲のみ対象） |
| GET | `/api/songs/:id` | オプション | 曲詳細 |
| POST | `/api/songs` | 必須 | 曲作成 |
| PUT | `/api/songs/:id` | 必須 | 曲更新（所有者のみ） |
| DELETE | `/api/songs/:id` | 必須 | 曲削除（所有者のみ） |

認証は `Authorization: Bearer <supabase_jwt>` ヘッダーで行う。

## データベース

既存の Supabase PostgreSQL データベースをそのまま使用する。Drizzle ORM のスキーマ定義（`src/db/schema.ts`）は既存テーブルに合わせてある。

### スキーマの変更が必要な場合

```bash
# スキーマファイル (src/db/schema.ts) を編集後:
pnpm db:generate   # マイグレーションファイルを生成
pnpm db:push       # DBに直接反映（開発環境向け）
```

### シードデータの投入

開発用のサンプルデータをDBに投入する。

```bash
pnpm db:seed
```

ユーザー5件、楽曲15件、ブックマーク5件、共有リンク3件のサンプルデータが生成される。
シードデータの内容は `src/db/seed.ts` で変更可能。

> **注意:** 既存データがある場合、重複エラーになる可能性がある。開発環境での使用を推奨。

### 既存DBからスキーマを再生成する場合

```bash
npx drizzle-kit pull
```

> **注意:** 現在のテーブル名・カラム名は EF Core の規約に従い PascalCase（`Songs`, `UserId` 等）。Drizzle スキーマでは `pgTable('Songs', { userId: uuid('UserId') })` のように明示的に指定している。

## Docker

```bash
# ビルド
docker build -t chordbook-backend .

# 起動
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e SUPABASE_URL=https://... \
  -e ALLOWED_ORIGINS=https://your-frontend.com \
  chordbook-backend
```

## プロジェクト構造

```
src/
├── index.ts              # エントリポイント
├── app.ts                # Honoアプリ定義（CORS, logger, エラーハンドラ）
├── routes/
│   ├── health.ts         # GET /api/health
│   └── songs.ts          # Song CRUD + 検索
├── middleware/
│   └── auth.ts           # Supabase JWT認証
├── db/
│   ├── schema.ts         # Drizzle ORMスキーマ
│   └── index.ts          # DBクライアント初期化
├── services/
│   └── song.service.ts   # ビジネスロジック
└── types/
    └── index.ts          # Visibility定数・型定義
```
