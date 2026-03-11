# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語設定
常に日本語で会話してください。

## プロジェクト概要
ChordBook - コード譜を作成・管理・共有できるWebアプリケーション

## 技術スタック
- **フロントエンド:** Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS + Zustand
- **バックエンド:** Hono + Drizzle ORM + Zod + jose (JWT検証)
- **データベース:** PostgreSQL (Supabase)
- **認証:** Supabase Auth (JWT)
- **ホスティング:** Vercel (FE), Railway (BE)

## コマンド

### フロントエンド (apps/frontend)
```bash
pnpm dev          # 開発サーバー起動 (localhost:3000)
pnpm build        # 本番ビルド
pnpm lint         # ESLint実行
pnpm lint --fix   # ESLint自動修正
```

### バックエンド (apps/backend-hono)
```bash
cd apps/backend-hono
pnpm dev          # 開発サーバー起動 (tsx watch, localhost:8080)
pnpm build        # 本番ビルド (tsup)
pnpm start        # 本番起動 (node dist/index.js)
pnpm test         # テスト実行 (vitest)
```

## アーキテクチャ

### フロントエンド構造
```
apps/frontend/src/
├── app/          # Next.js App Router (ページ・レイアウト)
├── lib/          # API通信、ユーティリティ
├── stores/       # Zustand ストア (authStore, editorStore)
└── types/        # TypeScript型定義
```

### バックエンド構造 (Hono)
```
apps/backend-hono/src/
├── index.ts              # エントリポイント
├── app.ts                # Honoアプリ定義（CORS, logger, エラーハンドラ）
├── routes/
│   ├── health.ts         # GET /api/health
│   └── songs.ts          # Song CRUD + 検索（Zodバリデーション）
├── middleware/
│   └── auth.ts           # Supabase JWT認証（jose）
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
Frontend (Zustand) → API Request → Backend (Hono Route → Service) → Drizzle ORM → PostgreSQL

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

## Supabase 開発ルール
- **DBスキーマ変更は必ずローカルのSupabase CLIを使用する**
  - `supabase migration new <name>` でマイグレーションファイルを作成
  - `supabase db reset` でローカルDBに適用・検証
  - Supabase MCP（クラウド）への直接マイグレーション適用は禁止
- クラウド（本番）Supabaseへの反映は将来的にCI経由で行う
- ローカルSupabase: `supabase start` で起動、`supabase status` で接続情報確認

## 環境変数（バックエンド）
```
DATABASE_URL      # PostgreSQL接続文字列
SUPABASE_URL      # Supabase URL
ALLOWED_ORIGINS   # CORS許可オリジン（カンマ区切り）
PORT              # サーバーポート（デフォルト: 8080）
```

## 詳細ドキュメント
`docs/` ディレクトリに包括的なドキュメントあり:
- `architecture/` - システム構成図、アーキテクチャ詳細
- `development/` - 環境構築、コーディング規約、Git運用
- `api/` - REST API仕様
- `database/` - ER図、テーブル定義
- `plans/` - 移行計画（backend-migration-to-hono.md）
