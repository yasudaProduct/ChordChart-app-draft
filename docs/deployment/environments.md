# 環境変数

ChordBook の環境変数一覧と設定方法です。

## フロントエンド（Next.js）

### 必須環境変数

| 変数名                            | 説明                   | 例                        |
| --------------------------------- | ---------------------- | ------------------------- |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk 公開キー         | pk_test_XXXXXXXX          |
| CLERK_SECRET_KEY                  | Clerk シークレットキー | sk_test_XXXXXXXX          |
| NEXT_PUBLIC_API_URL               | バックエンドAPI URL    | http://localhost:8080/api |

### 設定方法

#### ローカル開発

`.env.local` ファイルを作成:

```bash
# frontend/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXX
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

#### Cloudflare Pages（ステージング / 本番）

通常は GitHub Actions が自動で設定します。GitHub Environments（`staging` / `production`）に登録した値が、ビルド時の環境変数として使われ、デプロイ後に `wrangler pages secret put` でランタイム変数としても同期されます。

| GitHub Environment secret | Pages 側の変数名                    |
| ------------------------- | ----------------------------------- |
| `CLERK_PUBLISHABLE_KEY`   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY`        | `CLERK_SECRET_KEY`                  |
| `API_URL`                 | `NEXT_PUBLIC_API_URL`               |

手動で確認・変更する場合は Cloudflare ダッシュボード → Workers & Pages → 対象 Pages プロジェクト → Settings → Environment variables。

---

## バックエンド（Hono）

### 必須環境変数

| 変数名               | 説明                                       | 例                                                      |
| -------------------- | ------------------------------------------ | ------------------------------------------------------- |
| DATABASE_URL         | PostgreSQL 接続文字列                      | postgresql://postgres:postgres@127.0.0.1:5432/chordbook |
| DATABASE_DRIVER      | DB ドライバ（`postgres-js` / `neon-http`） | postgres-js                                             |
| CLERK_ISSUER         | Clerk Issuer URL（JWT検証用）              | https://xxx.clerk.accounts.dev                          |
| CLERK_WEBHOOK_SECRET | Clerk Webhook 署名検証シークレット         | whsec_XXXXXXXX                                          |
| ALLOWED_ORIGINS      | CORS 許可オリジン（カンマ区切り）          | http://localhost:3000                                   |

### オプション環境変数

| 変数名 | 説明           | デフォルト |
| ------ | -------------- | ---------- |
| PORT   | サーバーポート | 8080       |

### 設定方法

#### ローカル開発

`.env` ファイルを作成:

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/chordbook
DATABASE_DRIVER=postgres-js
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXX
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

#### Cloudflare Workers（ステージング / 本番）

公開してよい設定値は `apps/backend/wrangler.toml` の環境別 `vars` に記述し、秘匿情報は `wrangler secret` で登録します。**`vars` / `secrets` は環境に継承されない**ため、環境ごとに定義が必要です。

```toml
# apps/backend/wrangler.toml
[env.staging]
name = "chordbook-api-staging"

[env.staging.vars]
ALLOWED_ORIGINS = "https://chordbook-frontend-staging.pages.dev,http://localhost:3000"
# Cloudflare Workers では neon-http を使用（postgres-js は不可）
DATABASE_DRIVER = "neon-http"

[env.production]
name = "chordbook-api-production"

[env.production.vars]
ALLOWED_ORIGINS = "https://chord-books.com"
DATABASE_DRIVER = "neon-http"
```

シークレットは通常 GitHub Actions が Environment secrets から同期します。手動で登録する場合は `--env` で環境を指定します。

```bash
# 値はプロンプトで安全に入力
cd apps/backend
npx wrangler secret put DATABASE_URL --env production
npx wrangler secret put CLERK_ISSUER --env production
npx wrangler secret put CLERK_WEBHOOK_SECRET --env production
```

> Workers ランタイムにはポートの概念がないため `PORT` は不要です（ローカル Node 実行時のみ使用）。

---

## Clerk 設定

Clerk は **development と production で別インスタンス**です（ユーザーデータは共有されません）。ダッシュボード上部の環境切り替えで対象インスタンスを選んでから設定します。

### Configure → API Keys

| 項目            | 用途                              | development                      | production                    |
| --------------- | --------------------------------- | -------------------------------- | ----------------------------- |
| Publishable Key | NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | `pk_test_XXXX`                   | `pk_live_XXXX`                |
| Secret Key      | CLERK_SECRET_KEY                  | `sk_test_XXXX`                   | `sk_live_XXXX`                |
| Frontend API    | CLERK_ISSUER                      | `https://xxx.clerk.accounts.dev` | `https://clerk.chord-books.com` |

### Configure → Webhooks

インスタンスごとに Webhook エンドポイントを登録し、`user.created` / `user.updated` / `user.deleted` を有効化します。

| 環境         | エンドポイント URL                                                       |
| ------------ | ------------------------------------------------------------------------ |
| ステージング | `https://chordbook-api-staging.<account>.workers.dev/api/webhooks/clerk` |
| 本番         | `https://api.chord-books.com/api/webhooks/clerk`                           |

Webhook シークレットを `CLERK_WEBHOOK_SECRET` に設定。

---

## GitHub Environments のシークレット

CI/CD が使う値は GitHub Environments（`staging` / `production`）に**同じ名前**で登録し、環境ごとに値を切り替えます。

| シークレット名          | 対応する環境変数                    |
| ----------------------- | ----------------------------------- |
| `DATABASE_URL`          | `DATABASE_URL`                      |
| `CLERK_ISSUER`          | `CLERK_ISSUER`                      |
| `CLERK_WEBHOOK_SECRET`  | `CLERK_WEBHOOK_SECRET`              |
| `CLERK_PUBLISHABLE_KEY` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY`      | `CLERK_SECRET_KEY`                  |
| `API_URL`               | `NEXT_PUBLIC_API_URL`               |

リポジトリレベルには共通の `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` と、CI のビルド検証用キーを置きます。登録手順は [本番環境セットアップ](../infrastructure/production-setup.md) を参照。

---

## 環境別設定一覧

### 開発環境（Development）

| サービス           | 設定値                              |
| ------------------ | ----------------------------------- |
| フロントエンド URL | http://localhost:3000               |
| バックエンド URL   | http://localhost:8080               |
| データベース       | localhost:5432（Docker PostgreSQL） |
| CORS               | http://localhost:3000               |

### ステージング環境（Staging）

| サービス           | 設定値                                                |
| ------------------ | ----------------------------------------------------- |
| フロントエンド URL | https://chordbook-frontend-staging.pages.dev          |
| バックエンド URL   | https://chordbook-api-staging.\<account\>.workers.dev |
| データベース       | Neon PostgreSQL（`staging` ブランチ）                 |
| CORS               | https://chordbook-frontend-staging.pages.dev          |

### 本番環境（Production）

| サービス           | 設定値                             |
| ------------------ | ---------------------------------- |
| フロントエンド URL | https://chord-books.com              |
| バックエンド URL   | https://api.chord-books.com          |
| データベース       | Neon PostgreSQL（`main` ブランチ） |
| 認証               | Clerk production インスタンス      |
| CORS               | https://chord-books.com              |

構築手順は [本番環境セットアップ](../infrastructure/production-setup.md) を参照。

---

## セキュリティ注意事項

1. **秘密情報をコミットしない**
   - `.env.local` / `.env` は `.gitignore` に含まれている
   - `.env.example` には実際の値を入れない

2. **NEXT*PUBLIC* プレフィックス**
   - このプレフィックスの変数はブラウザに公開される
   - 秘密情報には使用しない（`CLERK_SECRET_KEY` は `NEXT_PUBLIC_` なし）

3. **接続文字列**
   - 本番環境では SSL 接続を有効にする
   - `?sslmode=require` を追加

```
postgresql://postgres:xxx@db.xxx.neon.tech:5432/chordbook?sslmode=require
```

## 関連ドキュメント

- [フロントエンドデプロイ](./frontend-deploy.md) - Cloudflare Pages 設定
- [バックエンドデプロイ](./backend-deploy.md) - Cloudflare Workers 設定
- [環境構築](../development/getting-started.md) - ローカル開発
