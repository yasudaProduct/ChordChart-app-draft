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

## 環境一覧

| 項目               | ローカル開発            | ステージング                                          | 本番                          |
| ------------------ | ----------------------- | ----------------------------------------------------- | ----------------------------- |
| フロントエンド     | `http://localhost:3000` | `https://chordbook-frontend-staging.pages.dev`        | `https://chord-books.com`     |
| バックエンド API   | `http://localhost:8080` | `https://chordbook-api-staging.<account>.workers.dev` | `https://api.chord-books.com` |
| Pages プロジェクト | -                       | `chordbook-frontend-staging`                          | `chordbook-frontend`          |
| Worker 名          | -                       | `chordbook-api-staging`                               | `chordbook-api-production`    |
| データベース       | Docker PostgreSQL       | Neon `staging` ブランチ                               | Neon `main` ブランチ          |
| 認証               | Clerk development       | Clerk development（`pk_test`）                        | Clerk production（`pk_live`） |
| デプロイ契機       | -                       | `develop` へ push（自動）                             | `main` へ push（**承認後**）  |

> 本番ドメインは `chord-books.com` です。ドメインを変更する場合の手順は [本番環境セットアップ](./production-setup.md) の手順 0 を参照してください。

---

## アーキテクチャ図

ステージングと本番は同じ構成で、リソース名と接続先だけが異なります。

```
                        Cloudflare
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────┐     ┌──────────────────────┐   │
│   │  Cloudflare      │     │  Cloudflare Workers  │   │
│   │  Pages           │────▶│  (Hono API)          │   │
│   │  (Next.js)       │     │                      │   │
│   └────────┬─────────┘     └──────────┬───────────┘   │
│            │                          │               │
│   ┌────────▼────────┐      ┌──────────▼───────────┐   │
│   │  Clerk          │      │  Neon PostgreSQL     │   │
│   │  (認証)         │      │                      │   │
│   └─────────────────┘      └──────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Cloudflare

### ドメイン管理

| 環境         | フロントエンド                                 | バックエンド API                                      |
| ------------ | ---------------------------------------------- | ----------------------------------------------------- |
| ステージング | `https://chordbook-frontend-staging.pages.dev` | `https://chordbook-api-staging.<account>.workers.dev` |
| 本番         | `https://chord-books.com`（カスタムドメイン）  | `https://api.chord-books.com`（カスタムドメイン）     |

カスタムドメインは Cloudflare ダッシュボードの Pages / Workers 設定から追加します。DNS は同一 Cloudflare アカウントなら自動設定されます。

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

Pages は Workers と違い設定ファイル側でプロジェクトを切り替えられないため、環境の指定は `--project-name` フラグで行います（フラグが `wrangler.toml` の `name` より優先される）。

```bash
cd apps/frontend
pnpm deploy:staging      # → chordbook-frontend-staging
pnpm deploy:production   # → chordbook-frontend
```

> 本番プロジェクトは **Production branch = `main`** で作成する必要があります。ここが一致しないと `main` へのデプロイが Preview 扱いになり、本番の環境変数が反映されません。

**環境変数（Cloudflare Pages）**

| 変数名                              | 供給元                                            |
| ----------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | GitHub Environment secret `CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY`                  | GitHub Environment secret `CLERK_SECRET_KEY`      |
| `NEXT_PUBLIC_API_URL`               | GitHub Environment secret `API_URL`               |

ビルド時に埋め込まれるほか、デプロイ後に `wrangler pages secret put` でランタイム変数としても同期されます。詳細は [環境変数](../deployment/environments.md) を参照。

---

### Cloudflare Workers（バックエンド）

Hono は Cloudflare Workers をネイティブサポートしています。

**`apps/backend/wrangler.toml`**

環境は `[env.staging]` / `[env.production]` に分離しています。**`vars` と `secrets` は環境に継承されない**ため、各環境で定義します。

```toml
name = "chordbook-api"
main = "src/worker.ts"
compatibility_date = "2025-04-15"
compatibility_flags = ["nodejs_compat"]

[env.staging]
name = "chordbook-api-staging"

[env.staging.vars]
ALLOWED_ORIGINS = "https://chordbook-frontend-staging.pages.dev,http://localhost:3000"
DATABASE_DRIVER = "neon-http"

[env.production]
name = "chordbook-api-production"

[env.production.vars]
ALLOWED_ORIGINS = "https://chord-books.com"
DATABASE_DRIVER = "neon-http"
```

デプロイ時は必ず `--env` を付けます（付け忘れると top-level の `chordbook-api` が新規作成される）。

```bash
cd apps/backend
pnpm deploy:staging      # = wrangler deploy --env staging
pnpm deploy:production   # = wrangler deploy --env production
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

通常は GitHub Actions が Environment secrets の値を自動同期します。手動で設定する場合は環境を指定します。

```bash
cd apps/backend

wrangler secret put DATABASE_URL --env production
wrangler secret put CLERK_ISSUER --env production
wrangler secret put CLERK_WEBHOOK_SECRET --env production

wrangler secret list --env production
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

| ブランチ  | 用途                      |
| --------- | ------------------------- |
| `main`    | 本番データベース          |
| `staging` | ステージング（CI が接続） |

破壊的なスキーマ変更を本番へ適用する前は、`main` からバックアップブランチを作成しておくと復旧できます。

### マイグレーション

```bash
cd apps/backend

# スキーマ変更後にマイグレーション生成
pnpm db:generate

# 各環境の DB へ適用（develop / main への push 時は CI が自動実行）
pnpm db:migrate

# ローカル開発 DB へスキーマを直接反映
pnpm db:push
```

### シードデータ

seed は用途別に 2 種類に分かれる。

| コマンド            | 用途               | 挙動                                                                                |
| ------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `pnpm db:seed`      | 開発・テスト       | 全テーブルを `reset` し、ランダムデータ + デモ曲を投入（**破壊的**）                |
| `pnpm db:seed:demo` | ステージング・本番 | デモ用固定ユーザーと `isDemo` 曲のみを冪等投入（**非破壊**。CI が両環境で自動実行） |

デモ曲の定義は `apps/backend/src/db/demoSongs.ts` に集約し、両 seed で共有する。

---

## Clerk（認証）

ユーザー認証と管理を担います。**development と production は別インスタンス**で、ユーザーデータは共有されません。

### 設定項目

**API Keys（`Configure → API Keys`）**

| キー            | 用途                                | development                      | production                      |
| --------------- | ----------------------------------- | -------------------------------- | ------------------------------- |
| Publishable Key | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_XXXX`                   | `pk_live_XXXX`                  |
| Secret Key      | `CLERK_SECRET_KEY`                  | `sk_test_XXXX`                   | `sk_live_XXXX`                  |
| Frontend API    | `CLERK_ISSUER`（JWT 検証）          | `https://xxx.clerk.accounts.dev` | `https://clerk.chord-books.com` |

バックエンドは `${CLERK_ISSUER}/.well-known/jwks.json` から公開鍵を取得して JWT を検証します（`apps/backend/src/middleware/auth.ts`）。

**Webhook（`Configure → Webhooks`）**

バックエンドにユーザー情報を同期するために、インスタンスごとに Webhook を設定します。

| 環境         | エンドポイント URL                                                       |
| ------------ | ------------------------------------------------------------------------ |
| ステージング | `https://chordbook-api-staging.<account>.workers.dev/api/webhooks/clerk` |
| 本番         | `https://api.chord-books.com/api/webhooks/clerk`                         |

購読イベント: `user.created`, `user.updated`, `user.deleted`
Webhook シークレットを `CLERK_WEBHOOK_SECRET` に設定してください。

**Allowed Origins**

Clerk ダッシュボードの `Configure → Domains` でフロントエンドのオリジンを追加:

- ステージング: `https://chordbook-frontend-staging.pages.dev`、`http://localhost:3000`
- 本番: `https://chord-books.com`

---

## デプロイフロー

```
develop への push                    main への push
        │                                   │
        │                                   ├──▶ verify（lint / test / build）
        │                                   │         │
        │                                   │         ▼
        │                                   └──▶ 承認待ち（Required reviewers）
        │                                             │
        ▼                                             ▼
  deploy.yml（staging 環境）              deploy.yml（production 環境）
        │                                             │
        ├── backend                                   ├── backend
        │   ├── pnpm db:migrate                       │   ├── pnpm db:migrate
        │   ├── pnpm db:seed:demo                     │   ├── pnpm db:seed:demo
        │   ├── wrangler deploy --env staging         │   ├── wrangler deploy --env production
        │   └── ヘルスチェック                          │   └── ヘルスチェック
        │                                             │
        └── frontend                                  └── frontend
            ├── next-on-pages                             ├── next-on-pages
            ├── pages deploy（staging プロジェクト）        ├── pages deploy（本番プロジェクト）
            └── pages secret put                          └── pages secret put
```

ワークフロー定義:

| ファイル                                  | 役割                                                |
| ----------------------------------------- | --------------------------------------------------- |
| `.github/workflows/deploy.yml`            | ST / 本番共通のデプロイ手順（`workflow_call`）      |
| `.github/workflows/deploy-staging.yml`    | `develop` push → staging 環境で `deploy.yml` を呼ぶ |
| `.github/workflows/deploy-production.yml` | `main` push → 事前検証 → 承認 → `deploy.yml` を呼ぶ |
| `.github/workflows/ci.yml`                | lint・build・test（E2E は PR 時のみ）               |

シークレットは GitHub Environments（`staging` / `production`）に同じ名前で登録し、環境ごとに値を切り替えます。初回構築手順は [ステージング環境セットアップ](./staging-setup.md) / [本番環境セットアップ](./production-setup.md) を参照。

---

## 関連ドキュメント

- [ステージング環境セットアップ](./staging-setup.md) - 動作確認環境の初回構築手順
- [本番環境セットアップ](./production-setup.md) - 本番環境の初回構築手順とデプロイフロー
- [環境変数](../deployment/environments.md) - 環境変数一覧
- [アーキテクチャ概要](../architecture/overview.md) - システム構成の詳細
