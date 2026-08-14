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

初回は `develop` ブランチへプッシュすると GitHub Actions が `pnpm db:migrate` を実行し、Neon にテーブルを作成します（`STAGING_DATABASE_URL` が正しく設定されていること）。

ローカルで手動適用する場合:

```bash
cd apps/backend
DATABASE_URL="postgresql://..." pnpm db:migrate
```

開発中のローカル DB 向けには `pnpm db:push` も利用できます。

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

### 3.1 Worker の作成とシークレット設定

> **注意:** `apps/backend/src/db/index.ts` はモジュール読み込み時に `DATABASE_URL` を要求するため、
> 「先に `wrangler deploy`、後から `wrangler secret put`」の順序では、シークレット未登録の Worker が
> Cloudflare の起動検証で `Uncaught Error: DATABASE_URL is not set`（コード `10021`）として拒否されます。
> しかもこの時点では Worker 自体が存在しないため `wrangler secret put` も `This Worker does not exist`（コード `10007`）で失敗します。
> 新規 Worker は `--secrets-file` で「作成」と「シークレット設定」を同時に行います（[cloudflare/workers-sdk#14258](https://github.com/cloudflare/workers-sdk/issues/14258)）。

**リポジトリの外**に一時ファイルを作成します。

```bash
# 例: /tmp に作成。ファイル名は任意
cat > /tmp/chordbook-staging.env <<'EOF'
DATABASE_URL=（1.3 で取得した Neon staging ブランチの接続文字列）
CLERK_ISSUER=https://xxx.clerk.accounts.dev
EOF
```

`CLERK_WEBHOOK_SECRET` はこの時点でまだ発行されていません（手順 6 で Webhook を登録した後に取得します）。ここでは含めなくて構いません。

```bash
cd apps/backend
pnpm install
npx wrangler login  # ブラウザで認証
npx wrangler deploy --env staging --secrets-file /tmp/chordbook-staging.env
```

デプロイ完了後、Workers の URL が表示されます:

```
https://chordbook-api-staging.<あなたのサブドメイン>.workers.dev
```

この URL を控えておく（後の手順でフロントエンドの `NEXT_PUBLIC_API_URL` に使用）。

デプロイが成功したら、**一時ファイルを直ちに削除**してください。

```bash
rm /tmp/chordbook-staging.env
```

Worker が存在する状態になったので、以降の追加シークレットは通常の `wrangler secret put --env staging` で登録できます（手順 6 で `CLERK_WEBHOOK_SECRET` を登録する際に使用）。

### 3.2 ALLOWED_ORIGINS の更新

フロントエンドデプロイ後に Pages の URL が確定したら `wrangler.toml` を更新:

- **許可するのはフロント（Pages）のオリジン**（`https://` 付き）。API の Workers URL を入れないこと。
- ローカルからステージング API を叩く場合は、カンマ区切りで `http://localhost:3000` を追加してよい。

```toml
# apps/backend/wrangler.toml
[env.staging.vars]
ALLOWED_ORIGINS = "https://chordbook-frontend-staging.pages.dev,http://localhost:3000"
```

また、`nodejs_compat` 利用時に vars / secrets が `process.env` に載るよう、`compatibility_date` は `2025-04-01` 以降にしておく（リポジトリの `wrangler.toml` を参照）。

バックエンドは `DATABASE_DRIVER` で DB ドライバを切り替える。staging の Workers では `wrangler.toml` の `[vars]` で `DATABASE_DRIVER = "neon-http"` を設定している（ローカル Node 実行時は `postgres-js` を使用）。

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

## 5. GitHub のシークレット設定

### 5.1 リポジトリレベル（環境共通）

GitHub リポジトリ → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| シークレット名          | 値                       | 取得元   |
| ----------------------- | ------------------------ | -------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API トークン  | 手順 2.1 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID | 手順 2.2 |

### 5.2 staging Environment

環境ごとに変わる値は **Environment secrets** に登録します（本番と同じ名前で、値だけが異なる）。

GitHub リポジトリ → **Settings** → **Environments** → `staging` → **Add environment secret**、または `gh` コマンド（値はプロンプトで入力）:

```bash
gh secret set DATABASE_URL --env staging
gh secret set CLERK_ISSUER --env staging
gh secret set CLERK_WEBHOOK_SECRET --env staging
gh secret set CLERK_PUBLISHABLE_KEY --env staging
gh secret set CLERK_SECRET_KEY --env staging
gh secret set API_URL --env staging
```

| シークレット名          | 値                                                  | 取得元               |
| ----------------------- | --------------------------------------------------- | -------------------- |
| `DATABASE_URL`          | Neon `staging` ブランチの接続文字列                 | 手順 1.3             |
| `CLERK_ISSUER`          | `https://xxx.clerk.accounts.dev`                    | Clerk ダッシュボード |
| `CLERK_WEBHOOK_SECRET`  | `whsec_XXXXXXXX`                                    | Clerk ダッシュボード |
| `CLERK_PUBLISHABLE_KEY` | `pk_test_XXXXXXXX`                                  | Clerk ダッシュボード |
| `CLERK_SECRET_KEY`      | `sk_test_XXXXXXXX`                                  | Clerk ダッシュボード |
| `API_URL`               | `https://chordbook-api-staging.xxx.workers.dev/api` | 手順 3.1             |

> `DATABASE_URL` は CI の DB マイグレーション（`pnpm db:migrate`）と Workers のシークレット同期の両方で使用します。値は Neon の接続文字列で揃えてください。
>
> `staging` Environment はデプロイ可能ブランチを `develop` のみに制限しています。

---

## 6. Clerk の設定

### Webhook エンドポイントの登録

1. Clerk ダッシュボード → **Configure** → **Webhooks** → **Add Endpoint**
2. URL: `https://chordbook-api-staging.<サブドメイン>.workers.dev/api/webhooks/clerk`
3. イベント: `user.created`、`user.updated`、`user.deleted` を選択
4. **Create** → Signing Secret（`whsec_XXXXXXXX`）をコピー

取得した値を 2 箇所に登録します。

```bash
# 稼働中の Worker に即反映（次回 CI デプロイを待たずに使えるようにする）
cd apps/backend
npx wrangler secret put CLERK_WEBHOOK_SECRET --env staging

# GitHub Environment secret（以降の CI デプロイで同期される）
gh secret set CLERK_WEBHOOK_SECRET --env staging
```

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
        ▼
deploy-staging.yml → deploy.yml（staging 環境）
        │
        ├──▶ backend ジョブ
        │     ├── pnpm db:migrate                 → Neon（スキーマ適用）
        │     ├── pnpm db:seed:demo               → Neon（デモ曲を冪等投入・非破壊）
        │     ├── wrangler deploy --env staging   → Cloudflare Workers
        │     └── ヘルスチェック（/api/health）
        │
        └──▶ frontend ジョブ
              ├── pnpm exec next-on-pages
              ├── wrangler pages deploy           → Cloudflare Pages
              └── wrangler pages secret put       → ランタイム変数の同期
```

本番（`main` ブランチ）へのデプロイは承認を挟みます。[本番環境セットアップ](./production-setup.md) を参照。

---

## 関連ドキュメント

- [インフラ構成概要](./overview.md) - サービス構成の全体像
- [本番環境セットアップ](./production-setup.md) - 本番環境の初回構築手順
- [環境変数](../deployment/environments.md) - 環境変数一覧
