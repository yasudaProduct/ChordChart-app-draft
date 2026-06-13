# インフラ構成概要

ChordBook のインフラ構成をまとめたドキュメントです。

## サービス構成

| レイヤー       | サービス           | 用途                         |
| -------------- | ------------------ | ---------------------------- |
| フロントエンド | Cloudflare Pages   | Next.js アプリのホスティング |
| バックエンド   | Cloudflare Workers | Hono API サーバー            |
| DNS / CDN      | Cloudflare         | ドメイン管理、CDN、DDoS 対策 |
| データベース   | Neon               | PostgreSQL（サーバーレス）   |
| 認証           | Clerk              | ユーザー認証・管理           |

---

## アーキテクチャ図

```
                        Cloudflare
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────┐     ┌──────────────────────┐  │
│   │  Cloudflare      │     │  Cloudflare Workers  │  │
│   │  Pages           │────▶│  (Hono API)          │  │
│   │  (Next.js)       │     │  api.chordbook.app   │  │
│   │  chordbook.app   │     └──────────┬───────────┘  │
│   └────────┬─────────┘                │              │
│            │                          │              │
│   ┌────────▼────────┐      ┌──────────▼───────────┐  │
│   │  Clerk          │      │  Neon PostgreSQL      │  │
│   │  (認証)         │      │  (Database)           │  │
│   └─────────────────┘      └──────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Cloudflare

### ドメイン管理

Cloudflare でドメインを取得・管理します。

| 設定項目         | 値                                        |
| ---------------- | ----------------------------------------- |
| フロントエンド   | `chordbook.app`（または取得したドメイン） |
| バックエンド API | `api.chordbook.app`                       |

DNS レコードは Cloudflare Pages / Workers と連携後に自動設定されます。

### Cloudflare Pages（フロントエンド）

Next.js を `@cloudflare/next-on-pages` アダプター経由でデプロイします。

**ビルド設定**

| 項目               | 値                              |
| ------------------ | ------------------------------- |
| フレームワーク     | Next.js                         |
| ビルドコマンド     | `npx @cloudflare/next-on-pages` |
| 出力ディレクトリ   | `.vercel/output/static`         |
| Node.js バージョン | 20                              |
| ルートディレクトリ | `apps/frontend`                 |

**必要パッケージ**

```bash
cd apps/frontend
pnpm add -D @cloudflare/next-on-pages wrangler
```

**`apps/frontend/next.config.ts` の設定**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 向け設定
};

export default nextConfig;
```

**環境変数（Cloudflare Pages ダッシュボード）**

| 変数名                              | 値                              |
| ----------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_XXXXXXXX`              |
| `CLERK_SECRET_KEY`                  | `sk_live_XXXXXXXX`              |
| `NEXT_PUBLIC_API_URL`               | `https://api.chordbook.app/api` |

---

### Cloudflare Workers（バックエンド）

Hono は Cloudflare Workers をネイティブサポートしています。

**`apps/backend/wrangler.toml`**

```toml
name = "chordbook-api-staging"
main = "src/worker.ts"
compatibility_date = "2025-04-15"
compatibility_flags = ["nodejs_compat"]

[vars]
ALLOWED_ORIGINS = "https://chordbook-frontend-staging.pages.dev,http://localhost:3000"
# Cloudflare Workers では neon-http を使用（postgres.js は不可）
DATABASE_DRIVER = "neon-http"

# シークレットは wrangler secret で設定（wrangler.toml には書かない）
# DATABASE_URL, CLERK_ISSUER, CLERK_WEBHOOK_SECRET
```

**エントリポイント**

Workers 環境では Node.js の `serve()` ではなく `export default` を使います。ローカル Node 実行用の `src/index.ts`（`serve()`）とは別に、Workers 用のエントリ `src/worker.ts` を用意しています:

```typescript
// apps/backend/src/worker.ts
import { app } from "./app";

// Cloudflare Workers 向けエクスポート
export default app;
```

**シークレットの設定**

```bash
cd apps/backend

# 本番シークレットの登録
wrangler secret put DATABASE_URL
wrangler secret put CLERK_ISSUER
wrangler secret put CLERK_WEBHOOK_SECRET
```

**デプロイ**

```bash
cd apps/backend
pnpm wrangler deploy
```

---

## Neon（データベース）

サーバーレス PostgreSQL サービスです。

### 接続設定

| 項目           | 値                                                                                     |
| -------------- | -------------------------------------------------------------------------------------- |
| サービス       | [neon.tech](https://neon.tech)                                                         |
| リージョン     | Asia Pacific (Singapore 等)                                                            |
| 接続文字列形式 | `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/chordbook?sslmode=require` |

### ブランチ構成

Neon のブランチ機能を活用してデータを分離します:

| ブランチ  | 用途             |
| --------- | ---------------- |
| `main`    | 本番データベース |
| `develop` | 開発・検証用     |

### マイグレーション

```bash
cd apps/backend

# スキーマ変更後にマイグレーション生成
pnpm db:generate

# ステージング DB へ適用（develop プッシュ時は CI が自動実行）
pnpm db:migrate

# ローカル開発 DB へスキーマを直接反映
pnpm db:push
```

---

## Clerk（認証）

ユーザー認証と管理を担います。

### 設定項目

**API Keys（`Configure → API Keys`）**

| キー            | 用途                                               |
| --------------- | -------------------------------------------------- |
| Publishable Key | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`                |
| Secret Key      | `CLERK_SECRET_KEY`                                 |
| JWKS Endpoint   | `CLERK_ISSUER`（`https://xxx.clerk.accounts.dev`） |

**Webhook（`Configure → Webhooks`）**

バックエンドにユーザー情報を同期するために Webhook を設定します。

| 項目               | 値                                             |
| ------------------ | ---------------------------------------------- |
| エンドポイント URL | `https://api.chordbook.app/api/webhooks/clerk` |
| 購読イベント       | `user.created`, `user.updated`, `user.deleted` |

Webhook シークレットを `CLERK_WEBHOOK_SECRET` に設定してください。

**Allowed Origins**

Clerk ダッシュボードの `Configure → Domains` でフロントエンドのドメインを追加:

- `https://chordbook.app`

---

## 環境別設定

### 本番環境（Production）

| サービス         | URL                         |
| ---------------- | --------------------------- |
| フロントエンド   | `https://chordbook.app`     |
| バックエンド API | `https://api.chordbook.app` |
| データベース     | Neon `main` ブランチ        |

### 開発環境（Development）

| サービス       | URL                                                                 |
| -------------- | ------------------------------------------------------------------- |
| フロントエンド | `http://localhost:3000`                                             |
| バックエンド   | `http://localhost:8080`                                             |
| データベース   | Docker PostgreSQL（`localhost:5432`）または Neon `develop` ブランチ |

---

## デプロイフロー

```
GitHub (main ブランチへのマージ)
        │
        ├──▶ Cloudflare Pages（自動デプロイ）
        │         └── Next.js ビルド → chordbook.app
        │
        └──▶ Cloudflare Workers（自動デプロイ）
                  └── Hono API ビルド → api.chordbook.app
```

GitHub リポジトリを Cloudflare Pages / Workers に連携すると、`main` ブランチへのプッシュで自動デプロイが実行されます。

---

## 関連ドキュメント

- [ステージング環境セットアップ](./staging-setup.md) - 動作確認環境の初回構築手順
- [環境変数](../deployment/environments.md) - 環境変数一覧
- [アーキテクチャ概要](../architecture/overview.md) - システム構成の詳細
