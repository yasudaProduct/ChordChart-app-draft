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

現時点のデプロイ先はステージング環境（`develop` ブランチへのプッシュで自動デプロイ）。本番用カスタムドメイン（`chordbook.app` 等）は未設定の場合があります。

```
                        Cloudflare
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────┐     ┌──────────────────────┐  │
│   │  Cloudflare      │     │  Cloudflare Workers  │  │
│   │  Pages           │────▶│  (Hono API)          │  │
│   │  (Next.js)       │     │  chordbook-api-      │  │
│   │  chordbook-      │     │  staging.workers.dev │  │
│   │  frontend-       │     └──────────┬───────────┘  │
│   │  staging.pages   │                │              │
│   │  .dev            │                │              │
│   └────────┬─────────┘                │              │
│            │                          │              │
│   ┌────────▼────────┐      ┌──────────▼───────────┐  │
│   │  Clerk          │      │  Neon PostgreSQL      │  │
│   │  (認証)         │      │  (staging ブランチ)   │  │
│   └─────────────────┘      └──────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Cloudflare

### ドメイン管理

| 環境         | フロントエンド                                 | バックエンド API                                      |
| ------------ | ---------------------------------------------- | ----------------------------------------------------- |
| ステージング | `https://chordbook-frontend-staging.pages.dev` | `https://chordbook-api-staging.<account>.workers.dev` |
| 本番（予定） | `chordbook.app`（カスタムドメイン設定後）      | `api.chordbook.app`（カスタムドメイン設定後）         |

カスタムドメインを追加する場合は、Cloudflare ダッシュボードの Pages / Workers 設定から行います。DNS は同一 Cloudflare アカウントなら自動設定されます。

### Cloudflare Pages（フロントエンド）

Next.js を `@cloudflare/next-on-pages` アダプター経由でデプロイします。

**ビルド設定**

| 項目               | 値                                   |
| ------------------ | ------------------------------------ |
| フレームワーク     | Next.js (App Router)                 |
| ビルドコマンド     | `pnpm build:cf`（= `next-on-pages`） |
| 出力ディレクトリ   | `.vercel/output/static`              |
| Node.js バージョン | 22（CI）/ 20 以上（ローカル）        |
| ルートディレクトリ | `apps/frontend`                      |
| Pages プロジェクト | `chordbook-frontend-staging`         |

`@cloudflare/next-on-pages` と `wrangler` は `apps/frontend` の devDependencies に含まれています。

**環境変数（Cloudflare Pages）**

| 変数名                              | 値（ステージング例）                                      |
| ----------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_XXXXXXXX`                                        |
| `CLERK_SECRET_KEY`                  | `sk_test_XXXXXXXX`                                        |
| `NEXT_PUBLIC_API_URL`               | `https://chordbook-api-staging.<account>.workers.dev/api` |

詳細は [環境変数](../deployment/environments.md) を参照。

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

| ブランチ  | 用途                       |
| --------- | -------------------------- |
| `main`    | 本番データベース（将来用） |
| `staging` | ステージング（CI が接続）  |

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

### シードデータ

seed は用途別に 2 種類に分かれる。

| コマンド            | 用途               | 挙動                                                                                               |
| ------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `pnpm db:seed`      | 開発・テスト       | 全テーブルを `reset` し、ランダムデータ + デモ曲を投入（**破壊的**）                               |
| `pnpm db:seed:demo` | ステージング・本番 | デモ用固定ユーザーと `isDemo` 曲のみを冪等投入（**非破壊**。`develop` プッシュ時は CI が自動実行） |

デモ曲の定義は `apps/backend/src/db/demoSongs.ts` に集約し、両 seed で共有する。

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

| 項目               | 値                                                                       |
| ------------------ | ------------------------------------------------------------------------ |
| エンドポイント URL | `https://chordbook-api-staging.<account>.workers.dev/api/webhooks/clerk` |
| 購読イベント       | `user.created`, `user.updated`, `user.deleted`                           |

Webhook シークレットを `CLERK_WEBHOOK_SECRET` に設定してください。

**Allowed Origins**

Clerk ダッシュボードの `Configure → Domains` でフロントエンドのオリジンを追加:

- `https://chordbook-frontend-staging.pages.dev`
- `http://localhost:3000`（ローカル開発時）

---

## 環境別設定

### ステージング環境（Staging）

| サービス         | URL                                                   |
| ---------------- | ----------------------------------------------------- |
| フロントエンド   | `https://chordbook-frontend-staging.pages.dev`        |
| バックエンド API | `https://chordbook-api-staging.<account>.workers.dev` |
| データベース     | Neon `staging` ブランチ                               |

### ローカル開発環境（Development）

| サービス       | URL                                   |
| -------------- | ------------------------------------- |
| フロントエンド | `http://localhost:3000`               |
| バックエンド   | `http://localhost:8080`               |
| データベース   | Docker PostgreSQL（`localhost:5432`） |

### 本番環境（Production）

カスタムドメイン（`chordbook.app` / `api.chordbook.app`）と Neon `main` ブランチは、本番リリース時に設定予定。現時点ではステージング環境で動作確認を行います。

---

## デプロイフロー

```
develop ブランチへのプッシュ
        │
        ├──▶ deploy-backend ジョブ（GitHub Actions）
        │     ├── pnpm db:migrate   → Neon（スキーマ適用）
        │     ├── pnpm db:seed:demo → Neon（デモ曲を冪等投入）
        │     └── wrangler deploy   → Cloudflare Workers
        │
        └──▶ deploy-frontend ジョブ（GitHub Actions）
              ├── pnpm exec next-on-pages
              └── wrangler pages deploy → Cloudflare Pages
```

ワークフロー定義: `.github/workflows/deploy-staging.yml`。初回セットアップ手順は [ステージング環境セットアップ](./staging-setup.md) を参照。

`main` ブランチへの push / PR では `.github/workflows/ci.yml` が lint・build・test（E2E は PR 時）を実行します。

---

## 関連ドキュメント

- [ステージング環境セットアップ](./staging-setup.md) - 動作確認環境の初回構築手順
- [環境変数](../deployment/environments.md) - 環境変数一覧
- [アーキテクチャ概要](../architecture/overview.md) - システム構成の詳細
