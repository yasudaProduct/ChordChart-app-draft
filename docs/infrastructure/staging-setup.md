# ステージング環境セットアップ手順

Cloudflare Workers / Pages + Neon を使ったステージング環境の初回セットアップ手順です。

## 前提条件

- Cloudflare アカウントあり（ドメイン未設定でも可）
- GitHub リポジトリへの管理者アクセス
- Clerk の開発用インスタンス（既存のもので可）

---

## 1. Neon のセットアップ

### 1.1 アカウント作成

1. [neon.tech](https://neon.tech) にアクセスしサインアップ
2. プロジェクト名: `chordbook`、リージョン: `AWS ap-southeast-1`（シンガポール）を選択

### 1.2 ブランチとデータベースの確認

Neon はプロジェクト作成時に `main` ブランチと `chordbook` データベースが自動作成されます。

ステージング用に `staging` ブランチを作成:

1. Neon コンソール → **Branches** → **Create Branch**
2. ブランチ名: `staging`、親ブランチ: `main`

### 1.3 接続文字列の取得

1. Neon コンソール → **Connection Details**
2. `staging` ブランチを選択
3. **Connection string** をコピー（後の手順で使用）

```
postgresql://user:password@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/chordbook?sslmode=require
```

### 1.4 スキーマの適用

ローカルで `DATABASE_URL` を Neon staging の接続文字列に変更して実行:

```bash
cd apps/backend
DATABASE_URL="postgresql://..." pnpm db:push
```

---

## 2. Cloudflare のセットアップ

### 2.1 API トークンの作成

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) → **My Profile** → **API Tokens**
2. **Create Token** → **Custom token**
3. 以下のパーミッションを設定:

| リソース                   | パーミッション |
| -------------------------- | -------------- |
| Account > Workers Scripts  | Edit           |
| Account > Cloudflare Pages | Edit           |
| Account > Account Settings | Read           |

4. **Create Token** → トークンをコピー（一度しか表示されない）

### 2.2 Account ID の確認

Cloudflare ダッシュボードのサイドバー右下、または URL から確認:

```
https://dash.cloudflare.com/<ACCOUNT_ID>/...
```

---

## 3. Cloudflare Workers（バックエンド）の初回設定

### 3.1 Workers プロジェクトの初回デプロイ

ローカルから初回デプロイを実行（Workers プロジェクトを作成するため）:

```bash
cd apps/backend
pnpm install
npx wrangler login  # ブラウザで認証
pnpm deploy:staging
```

デプロイ完了後、Workers の URL が表示されます:

```
https://chordbook-api-staging.<あなたのサブドメイン>.workers.dev
```

この URL を控えておく（後の手順でフロントエンドの `NEXT_PUBLIC_API_URL` に使用）。

### 3.2 Workers のシークレット設定

```bash
cd apps/backend

# Neon の接続文字列を設定
npx wrangler secret put DATABASE_URL
# → 入力プロンプト: postgresql://...（1.3 で取得した接続文字列）

# Clerk Issuer URL を設定
npx wrangler secret put CLERK_ISSUER
# → 入力プロンプト: https://xxx.clerk.accounts.dev

# Clerk Webhook シークレットを設定
npx wrangler secret put CLERK_WEBHOOK_SECRET
# → 入力プロンプト: whsec_XXXXXXXX
```

### 3.3 ALLOWED_ORIGINS の更新

フロントエンドデプロイ後に Pages の URL が確定したら `wrangler.toml` を更新:

- **許可するのはフロント（Pages）のオリジン**（`https://` 付き）。API の Workers URL を入れないこと。
- ローカルからステージング API を叩く場合は、カンマ区切りで `http://localhost:3000` を追加してよい。

```toml
# apps/backend/wrangler.toml
[vars]
ALLOWED_ORIGINS = "https://chordbook-frontend-staging.pages.dev,http://localhost:3000"
```

また、`nodejs_compat` 利用時に vars / secrets が `process.env` に載るよう、`compatibility_date` は `2025-04-01` 以降にしておく（リポジトリの `wrangler.toml` を参照）。

再デプロイ:

```bash
pnpm deploy:staging
```

---

## 4. Cloudflare Pages（フロントエンド）の初回設定

### 4.1 Pages プロジェクトの作成

ローカルから初回デプロイを実行（Pages プロジェクトを作成するため）:

```bash
cd apps/frontend
pnpm install
npx wrangler login  # 認証済みであればスキップ
pnpm build:cf
pnpm deploy:staging
```

フロントエンドの URL が確定します:

```
https://chordbook-frontend-staging.pages.dev
```

---

## 5. GitHub Secrets の設定

GitHub リポジトリ → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** で以下を登録:

| シークレット名                  | 値                                                  | 取得元               |
| ------------------------------- | --------------------------------------------------- | -------------------- |
| `CLOUDFLARE_API_TOKEN`          | Cloudflare API トークン                             | 手順 2.1             |
| `CLOUDFLARE_ACCOUNT_ID`         | Cloudflare アカウント ID                            | 手順 2.2             |
| `STAGING_DATABASE_URL`          | Neon 接続文字列                                     | 手順 1.3             |
| `STAGING_CLERK_ISSUER`          | `https://xxx.clerk.accounts.dev`                    | Clerk ダッシュボード |
| `STAGING_CLERK_WEBHOOK_SECRET`  | `whsec_XXXXXXXX`                                    | Clerk ダッシュボード |
| `STAGING_CLERK_PUBLISHABLE_KEY` | `pk_test_XXXXXXXX`                                  | Clerk ダッシュボード |
| `STAGING_CLERK_SECRET_KEY`      | `sk_test_XXXXXXXX`                                  | Clerk ダッシュボード |
| `STAGING_API_URL`               | `https://chordbook-api-staging.xxx.workers.dev/api` | 手順 3.1             |

> `STAGING_DATABASE_URL` は Workers のシークレットとも二重管理になりますが、
> GitHub Actions のビルド時には不要です（Workers へは wrangler secret で設定済み）。
> フロントエンドビルド時の変数としては不要なため、省略可能です。

---

## 6. Clerk の設定

### Webhook エンドポイントの登録

1. Clerk ダッシュボード → **Configure** → **Webhooks** → **Add Endpoint**
2. URL: `https://chordbook-api-staging.<サブドメイン>.workers.dev/api/webhooks/clerk`
3. イベント: `user.created`、`user.updated`、`user.deleted` を選択
4. **Create** → Signing Secret をコピーして `STAGING_CLERK_WEBHOOK_SECRET` に設定

### Allowed Origins の設定

1. Clerk ダッシュボード → **Configure** → **Domains**
2. フロントエンドの URL を追加: `https://chordbook-frontend-staging.pages.dev`

---

## 7. 動作確認

### デプロイ後の確認

1. `develop` ブランチにプッシュ → GitHub Actions が自動実行されることを確認
2. Actions のログでデプロイ成功を確認
3. `https://chordbook-frontend-staging.pages.dev` にアクセスして動作確認
4. `https://chordbook-api-staging.<サブドメイン>.workers.dev/api/health` でヘルスチェック確認

---

## デプロイフロー（セットアップ後）

```
develop ブランチへのプッシュ
        │
        ├──▶ deploy-backend ジョブ
        │     └── wrangler deploy → Cloudflare Workers
        │
        └──▶ deploy-frontend ジョブ
              ├── next build
              ├── @cloudflare/next-on-pages
              └── wrangler pages deploy → Cloudflare Pages
```

---

## 関連ドキュメント

- [インフラ構成概要](./overview.md) - サービス構成の全体像
- [環境変数](../deployment/environments.md) - 環境変数一覧
