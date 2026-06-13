# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語設定

常に日本語で会話してください。

## プロジェクト概要

ChordBook - コード譜を作成・管理・共有できるWebアプリケーション

## 技術スタック

- **フロントエンド:** Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + Zustand
- **バックエンド:** Hono + Drizzle ORM + Zod + jose (JWT検証)
- **データベース:** PostgreSQL (Neon)
- **認証:** Clerk
- **ホスティング:** Cloudflare Pages (FE), Cloudflare Workers (BE)

## コマンド

### ローカル開発環境

```bash
docker compose up -d   # ローカルPostgreSQLを起動
```

### ルート（全ワークスペース一括）

```bash
pnpm install      # 全ワークスペースの依存関係をインストール
pnpm lint         # 全アプリのESLint実行
pnpm lint:fix     # 全アプリのESLint自動修正
pnpm format       # 全アプリのPrettierフォーマット適用
pnpm format:check # 全アプリのPrettierフォーマット確認
pnpm build        # 全アプリのビルド
pnpm test         # 全アプリのテスト実行
```

### フロントエンド (apps/frontend)

```bash
pnpm dev          # 開発サーバー起動 (localhost:3000)
pnpm build        # 本番ビルド
pnpm lint         # ESLint実行
pnpm lint:fix     # ESLint自動修正
pnpm format       # Prettierフォーマット適用
```

### バックエンド (apps/backend)

```bash
cd apps/backend
pnpm dev          # 開発サーバー起動 (tsx watch, localhost:8080)
pnpm build        # 本番ビルド (tsup)
pnpm start        # 本番起動 (node dist/index.js)
pnpm test         # テスト実行 (vitest)
pnpm lint         # ESLint実行
pnpm lint:fix     # ESLint自動修正
pnpm format       # Prettierフォーマット適用
pnpm db:generate  # Drizzleマイグレーション生成
pnpm db:push      # DBスキーマをプッシュ
```

## アーキテクチャ

### モノレポ構造

```
chord-chart/
├── apps/
│   ├── frontend/     # Next.js フロントエンド
│   └── backend/      # Hono バックエンド
└── packages/
    ├── eslint-config/    # @chordbook/eslint-config（共有ESLintルール）
    └── prettier-config/  # @chordbook/prettier-config（共有Prettierルール）
```

### フロントエンド構造

```
apps/frontend/src/
├── app/          # Next.js App Router (ページ・レイアウト)
├── lib/          # API通信、ユーティリティ
├── stores/       # Zustand ストア (authStore, editorStore)
└── types/        # TypeScript型定義
```

### バックエンド構造

```
apps/backend/src/
├── index.ts              # エントリポイント
├── app.ts                # Honoアプリ定義（CORS, logger, エラーハンドラ）
├── routes/
│   ├── health.ts         # GET /api/health
│   ├── songs.ts          # Song CRUD + 検索（Zodバリデーション）
│   └── webhooks.ts       # Clerk Webhook（ユーザー同期）
├── middleware/
│   └── auth.ts           # Clerk JWT認証（jose）
├── db/
│   ├── schema.ts         # Drizzle ORMスキーマ（4テーブル）
│   └── index.ts          # DBクライアント初期化
├── services/
│   └── song.service.ts   # ビジネスロジック
└── types/
    └── index.ts          # Visibility定数・型定義
```

### 主要エンティティ

- `Song` - 楽曲（タイトル、アーティスト、キー、BPM、セクション）
- `User` - ユーザー
- `Bookmark` - ブックマーク
- `SongShare` - 楽曲共有

### データフロー

Frontend (Clerk + Zustand) → API Request → Backend (Hono Route → Service) → Drizzle ORM → PostgreSQL

## コーディング規約

### TypeScript/React

- コンポーネント: PascalCase、関数コンポーネント（アロー関数）
- インデント: スペース2
- インポート順序: React → 外部ライブラリ → 内部モジュール → 型 → 相対パス

### Git コミットメッセージ

```
<type>: <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## DB開発ルール

- **DBスキーマ変更は Drizzle ORM のスキーマファイル (`apps/backend/src/db/schema.ts`) を編集する**
  - `pnpm db:generate` でマイグレーションファイルを生成
  - `pnpm db:push` でローカルDBに適用・検証
- ローカルDB: `docker compose up -d` で起動

## 環境変数（バックエンド）

```
DATABASE_URL         # PostgreSQL接続文字列
DATABASE_DRIVER      # DBドライバ（postgres-js / neon-http）
CLERK_ISSUER         # Clerk Issuer URL (例: https://xxx.clerk.accounts.dev)
CLERK_WEBHOOK_SECRET # Clerk Webhook署名検証シークレット
ALLOWED_ORIGINS      # CORS許可オリジン（カンマ区切り）
PORT                 # サーバーポート（デフォルト: 8080）
```

## 環境変数（フロントエンド）

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # Clerk公開キー
CLERK_SECRET_KEY                   # Clerkシークレットキー
NEXT_PUBLIC_API_URL                # バックエンドAPI URL
```

## 詳細ドキュメント

`docs/` ディレクトリに包括的なドキュメントあり:

- `architecture/` - システム構成図、アーキテクチャ詳細
- `development/` - 環境構築、コーディング規約、Git運用
- `api/` - REST API仕様
- `database/` - ER図、テーブル定義
