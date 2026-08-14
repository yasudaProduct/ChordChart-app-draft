# 本番環境セットアップ手順

Cloudflare Workers / Pages + Neon + Clerk による本番環境の初回構築手順です。
ステージング環境については [ステージング環境セットアップ](./staging-setup.md) を参照してください。

> **ドメイン名について**
> 本番ドメインは `chord-books.com`（取得済み）です。ドメインを変更する場合は [手順 0](#0-ドメインを取得する) の置換コマンドを参照してください。

---

## 全体像

| レイヤー       | ステージング                                          | 本番                                       |
| -------------- | ----------------------------------------------------- | ------------------------------------------ |
| フロントエンド | `chordbook-frontend-staging`（Pages）                 | `chordbook-frontend`（Pages）              |
| バックエンド   | `chordbook-api-staging`（Workers）                    | `chordbook-api-production`（Workers）      |
| データベース   | Neon `staging` ブランチ                               | Neon `main` ブランチ                       |
| 認証           | Clerk development インスタンス（`pk_test`）           | Clerk production インスタンス（`pk_live`） |
| フロント URL   | `https://chordbook-frontend-staging.pages.dev`        | `https://chord-books.com`                  |
| API URL        | `https://chordbook-api-staging.<account>.workers.dev` | `https://api.chord-books.com`              |
| デプロイ契機   | `develop` へ push（自動）                             | `main` へ push → **承認後**に実行          |

デプロイフロー:

```
feature/* ──PR──▶ develop ──push──▶ Deploy Staging（自動・承認なし）
                     │
                     └──PR──▶ main ──push──▶ 事前検証（lint/test/build）
                                                    │
                                                    ▼
                                             承認待ち（Required reviewers）
                                                    │
                                                    ▼
                                             Deploy Production
```

ワークフロー定義:

| ファイル                                  | 役割                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| `.github/workflows/deploy.yml`            | ST / 本番共通のデプロイ手順（`workflow_call`）                 |
| `.github/workflows/deploy-staging.yml`    | `develop` push → staging 環境で `deploy.yml` を呼ぶ            |
| `.github/workflows/deploy-production.yml` | `main` push → 事前検証 → production 環境で `deploy.yml` を呼ぶ |

---

## 前提条件

- ステージング環境が構築済みであること
- Cloudflare アカウント（ステージングと同一アカウントで可）
- Neon プロジェクト `chordbook`（`main` ブランチが未使用のまま残っていること）
- Clerk アカウント（ステージングと同一アプリケーションで可）
- GitHub リポジトリの管理者権限

---

## 0. ドメインを取得する（取得済み: `chord-books.com`）

Clerk の production インスタンスは独自ドメインが必須のため、最初にドメインを用意します。

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com) → **Domain Registration** → **Register Domains**
2. 希望のドメインを検索して購入（Cloudflare Registrar で取得すると DNS が同一アカウント内で完結する）
3. 購入後、自動的に Cloudflare の DNS ゾーンが作成される

> 他社で取得済みのドメインを使う場合は、Cloudflare にサイトを追加してネームサーバーを Cloudflare のものに変更してください。Pages の apex ドメイン割り当てには Cloudflare ゾーンであることが必要です。

### ドメインを変更する場合

リポジトリ内の `chord-books.com` を新しいドメインへ一括置換します。

```bash
# リポジトリルートで実行（macOS）
grep -rl 'chord-books\.com' --include='*.toml' --include='*.md' --include='*.ts' . \
  | xargs sed -i '' 's/chord-books\.com/new-domain.com/g'

# Linux の場合は sed -i 's/.../.../g'
```

置換対象の主な箇所:

| ファイル                           | 内容                                         |
| ---------------------------------- | -------------------------------------------- |
| `apps/backend/wrangler.toml`       | `[env.production.vars]` の `ALLOWED_ORIGINS` |
| `apps/backend/src/db/demoSongs.ts` | デモユーザーのメールアドレス                 |
| `docs/**/*.md`                     | 各ドキュメントの URL 表記                    |

置換後は差分を確認してからコミットし、Clerk の Domains 設定・Cloudflare のカスタムドメイン・Webhook URL も新ドメインへ更新してください。

---

## 1. Clerk（本番インスタンス）

DNS の伝播に時間がかかる（最大 48 時間、通常は数分〜数時間）ため、最初に着手します。

### 1.1 production インスタンスの作成

1. [Clerk ダッシュボード](https://dashboard.clerk.com) で対象アプリケーションを開く
2. 画面上部の環境切り替え（Development）から **Create production instance** を選択
3. development インスタンスの設定をコピーするか選択する

- **SSO connections / Integrations / Paths の設定はコピーされない**ため、後で個別に設定する

> **注意:** production インスタンスは development とは完全に別のユーザーストアです。ステージングで作成したユーザーは引き継がれません。

### 1.2 ドメインと DNS レコードの設定

1. Clerk ダッシュボード（production インスタンス）→ **Configure** → **Domains**
2. 本番ドメイン（`chord-books.com`）を入力
3. 表示される DNS レコード（`clerk`、`accounts`、`clkmail`、`clk._domainkey` などの CNAME）を Cloudflare の DNS に追加する

- Cloudflare ダッシュボード → 対象ゾーン → **DNS** → **Add record**
- **Proxy status は「DNS only」（グレーの雲）にする。** オレンジの雲（Proxied）だと Clerk の検証が通らない

4. Clerk ダッシュボードで **Verify** を実行し、すべてのレコードが緑になることを確認

### 1.3 API キーの控え

**Configure** → **API Keys** から以下を控えます（手順 6 で GitHub に登録）。

| 項目             | 値の形式                        | 用途                    |
| ---------------- | ------------------------------- | ----------------------- |
| Publishable Key  | `pk_live_XXXXXXXX`              | `CLERK_PUBLISHABLE_KEY` |
| Secret Key       | `sk_live_XXXXXXXX`              | `CLERK_SECRET_KEY`      |
| Frontend API URL | `https://clerk.chord-books.com` | `CLERK_ISSUER`          |

> `CLERK_ISSUER` はバックエンドの JWT 検証（`apps/backend/src/middleware/auth.ts`）で `${CLERK_ISSUER}/.well-known/jwks.json` を取得するために使います。development の `https://xxx.clerk.accounts.dev` とは異なり、production では `https://clerk.<ドメイン>` になります。

> **Secret Key が見つからない・マスクされている場合:** API Keys ページには **Legacy secret keys**（インスタンス作成時からある古いキー）と **Standard API Keys**（新しいキーローテーション対応のキー）が別セクションで表示されることがあります。Legacy 側は値が非表示のままのことがあるため、**Standard API Keys** セクション内の **Secret keys** → **+ Add new key** から新しいキーを作成してください。作成直後にしか平文表示されないため、その場でコピーして手順 6 の登録に使います。Clerk は同一インスタンスで複数の Secret Key を同時に有効化できるため、Legacy キーを使わなくても問題ありません。
>
> 値が作成後も見えない・「+ Add new key」も操作できない場合は、Clerk ワークスペースでの自分のロールが **Admin** になっているか確認してください（Member ロールは一覧表示のみで、作成・閲覧はできません）。

### 1.4 Webhook の登録

手順 5 で API のカスタムドメインを設定した後に実施します（URL が確定してから）。

1. **Configure** → **Webhooks** → **Add Endpoint**
2. URL: `https://api.chord-books.com/api/webhooks/clerk`
3. イベント: `user.created`、`user.updated`、`user.deleted`
4. Signing Secret（`whsec_XXXXXXXX`）を控える → `CLERK_WEBHOOK_SECRET`

---

## 2. Neon（本番データベース）

本番は Neon プロジェクト `chordbook` の `main` **ブランチ**を使います（ステージングは `staging` ブランチ）。

1. Neon コンソール → **Branches** → `main` を選択
2. **Connection Details** から接続文字列をコピー

```
postgresql://user:password@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/chordbook?sslmode=require
```

この値を `DATABASE_URL`（production Environment）に登録します（手順 6）。

> スキーマの適用（`pnpm db:migrate`）とデモ曲の投入（`pnpm db:seed:demo`）は、本番デプロイのワークフローが自動実行します。手動での事前適用は不要です。

---

## 3. Cloudflare Workers（本番 API）

**初回のみローカルから Worker を作成**します（CI からの初回デプロイはシークレット未登録で失敗するため）。

> **注意:** `apps/backend/src/db/index.ts` はモジュール読み込み時に `DATABASE_URL` を要求するため、
> 「先に `wrangler deploy`、後から `wrangler secret put`」という順序は通りません。
> シークレット未登録の Worker は Cloudflare 側の起動検証で `Uncaught Error: DATABASE_URL is not set`（コード `10021`）として拒否され、
> しかもこの時点では Worker 自体がまだ存在しないため `wrangler secret put` も `This Worker does not exist`（コード `10007`）で失敗します。
> 新規 Worker では `--secrets-file` で「作成」と「シークレット設定」を同時に行う必要があります（[cloudflare/workers-sdk#14258](https://github.com/cloudflare/workers-sdk/issues/14258)）。

### 3.1 シークレットファイルを一時的に作成する

**リポジトリの外**（`.gitignore` に頼らない場所）に一時ファイルを作成します。

```bash
# 例: /tmp に作成。ファイル名は任意
cat > /tmp/chordbook-production.env <<'EOF'
DATABASE_URL=（Neon の main ブランチの接続文字列。手順 2 で取得したもの）
CLERK_ISSUER=https://clerk.chord-books.com
EOF
```

`CLERK_WEBHOOK_SECRET` はこの時点でまだ発行されていません（手順 1.4 は手順 5 の後）。ここでは含めなくて構いません。

### 3.2 Worker を作成しつつシークレットを設定する

```bash
cd apps/backend
npx wrangler login          # 認証済みならスキップ
npx wrangler deploy --env production --secrets-file /tmp/chordbook-production.env
```

Worker `chordbook-api-production` が作成され、URL が表示されます。

```
https://chordbook-api-production.<あなたのサブドメイン>.workers.dev
```

デプロイが成功したら、**一時ファイルを直ちに削除**してください。

```bash
rm /tmp/chordbook-production.env
```

### 3.3 残りのシークレットを登録する

Worker が存在する状態になったので、以降は通常の `wrangler secret put` が使えます。`CLERK_WEBHOOK_SECRET` は手順 1.4 を終えたあとに登録してください。

```bash
cd apps/backend
npx wrangler secret put CLERK_WEBHOOK_SECRET --env production

# 登録済みシークレットの確認（値は表示されない）
npx wrangler secret list --env production
```

> 以降のデプロイでは、GitHub Actions が Environment secrets の値を `wrangler secret put` で自動同期します（`.github/workflows/deploy.yml` の `secrets:` 入力）。値を変更したいときは GitHub 側を更新して再デプロイすれば反映されます。この `--secrets-file` の手順が必要なのは、Worker が一度も存在しない**最初の 1 回だけ**です。

---

## 4. Cloudflare Pages（本番フロントエンド）[api.chord-books.com](http://api.chord-books.com)

Pages プロジェクトは **Production branch を** `main` **にして作成**します。ここを誤ると `main` へのデプロイが Preview 扱いになり、本番用の環境変数が反映されません。

```bash
cd apps/frontend
npx wrangler pages project create chordbook-frontend --production-branch main
```

初回デプロイ:

```bash
cd apps/frontend
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_XXXX \
CLERK_SECRET_KEY=sk_live_XXXX \
NEXT_PUBLIC_API_URL=https://api.chord-books.com/api \
  pnpm build:cf

pnpm deploy:production      # = wrangler pages deploy ... --project-name=chordbook-frontend --branch=main
```

`https://chordbook-frontend.pages.dev` が払い出されます。

---

## 5. カスタムドメインの割り当て

### 5.1 フロントエンド（Pages）

1. Cloudflare ダッシュボード → **Workers & Pages** → `chordbook-frontend` → **Custom domains**
2. **Set up a domain** → `chord-books.com` を入力
3. 同一 Cloudflare アカウントのゾーンであれば DNS レコードは自動作成される

### 5.2 バックエンド（Workers）

1. Cloudflare ダッシュボード → **Workers & Pages** → `chordbook-api-production` → **Settings** → **Domains & Routes**
2. **Add** → **Custom domain** → `api.chord-books.com` を入力

割り当て後、以下でヘルスチェックを確認します。

```bash
curl https://api.chord-books.com/api/health
# {"status":"healthy","timestamp":"..."}
```

### 5.3 Clerk の Allowed Origins

Clerk ダッシュボード（production）→ **Configure** → **Domains** で、フロントエンドのオリジン `https://chord-books.com` が登録されていることを確認します。

---

## 6. GitHub Environments とシークレット

本番・ステージングのシークレットは **GitHub Environments** で管理します（環境ごとに同じ名前で別の値を持たせる）。

Environment は作成済みです:

| Environment  | デプロイ可能ブランチ | 承認                                     |
| ------------ | -------------------- | ---------------------------------------- |
| `staging`    | `develop` のみ       | なし                                     |
| `production` | `main` のみ          | Required reviewers（リポジトリオーナー） |

### 6.1 登録するシークレット

**production Environment**

| シークレット名          | 値                                | 取得元   |
| ----------------------- | --------------------------------- | -------- |
| `DATABASE_URL`          | Neon `main` ブランチの接続文字列  | 手順 2   |
| `CLERK_ISSUER`          | `https://clerk.chord-books.com`   | 手順 1.3 |
| `CLERK_WEBHOOK_SECRET`  | `whsec_XXXXXXXX`                  | 手順 1.4 |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_XXXXXXXX`                | 手順 1.3 |
| `CLERK_SECRET_KEY`      | `sk_live_XXXXXXXX`                | 手順 1.3 |
| `API_URL`               | `https://api.chord-books.com/api` | 手順 5.2 |

**staging Environment**（既存のリポジトリシークレットから値を移す）

| シークレット名          | 移行元のリポジトリシークレット  |
| ----------------------- | ------------------------------- |
| `DATABASE_URL`          | `STAGING_DATABASE_URL`          |
| `CLERK_ISSUER`          | `STAGING_CLERK_ISSUER`          |
| `CLERK_WEBHOOK_SECRET`  | `STAGING_CLERK_WEBHOOK_SECRET`  |
| `CLERK_PUBLISHABLE_KEY` | `STAGING_CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY`      | `STAGING_CLERK_SECRET_KEY`      |
| `API_URL`               | `STAGING_API_URL`               |

**リポジトリレベル（共通・そのまま）**

| シークレット名                      | 用途                                   |
| ----------------------------------- | -------------------------------------- |
| `CLOUDFLARE_API_TOKEN`              | Workers / Pages のデプロイ             |
| `CLOUDFLARE_ACCOUNT_ID`             | 同上                                   |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | CI（lint / build / E2E）のビルド検証用 |
| `CLERK_SECRET_KEY`                  | 同上                                   |

> リポジトリレベルにも `CLERK_SECRET_KEY` がありますが、Environment を指定したジョブでは Environment 側の値が優先されるため衝突しません。
>
> ⚠️ ただし **production Environment に** `CLERK_SECRET_KEY` **を登録し忘れると、リポジトリレベルの開発用キー（**`sk_test_`**）が本番ビルドに使われます。** デプロイワークフローの冒頭で必須シークレットの存在チェックを行っていますが、この 1 つだけはリポジトリ側の値にフォールバックするため検出できません。必ず登録してください。

### 6.2 登録コマンド

```bash
# 本番（値はプロンプトで入力）
gh secret set DATABASE_URL --env production
gh secret set CLERK_ISSUER --env production
gh secret set CLERK_WEBHOOK_SECRET --env production
gh secret set CLERK_PUBLISHABLE_KEY --env production
gh secret set CLERK_SECRET_KEY --env production
gh secret set API_URL --env production

# ステージング（既存の STAGING_* と同じ値を入れる）
gh secret set DATABASE_URL --env staging
gh secret set CLERK_ISSUER --env staging
gh secret set CLERK_WEBHOOK_SECRET --env staging
gh secret set CLERK_PUBLISHABLE_KEY --env staging
gh secret set CLERK_SECRET_KEY --env staging
gh secret set API_URL --env staging

# 登録確認
gh secret list --env production
gh secret list --env staging
```

> **順序に注意:** 新しいワークフローは Environment secrets を参照します。`STAGING_`\* からの移行が終わる前に `develop` へマージすると、ステージングのデプロイが失敗します。**先に staging Environment のシークレットを登録**してからマージしてください。
>
> 移行後、不要になった `STAGING_*` のリポジトリシークレットは、ステージングのデプロイが1回成功したことを確認してから削除してください。

---

## 7. 初回デプロイと動作確認

1. `develop` へマージ → **Deploy Staging** が成功することを確認（Environment secrets への移行検証）
2. `develop` → `main` の PR を作成してマージ
3. **Deploy Production** が起動し、「事前検証」ジョブが完了する
4. Actions の画面に **Review deployments** が表示されるので、`production` を承認する
5. デプロイ完了後、以下を確認する

| 確認項目                     | 方法                                               |
| ---------------------------- | -------------------------------------------------- |
| API のヘルスチェック         | `curl https://api.chord-books.com/api/health`      |
| フロントエンドの表示         | `https://chord-books.com` にアクセス               |
| 認証                         | サインアップ → ログイン → マイページ表示           |
| Clerk Webhook のユーザー同期 | サインアップ後に楽曲を作成できること               |
| CORS                         | ブラウザのコンソールに CORS エラーが出ないこと     |
| デモ曲                       | 未ログイン状態で `/songs` にデモ曲が表示されること |

---

## デプロイフロー（セットアップ後）

```
main ブランチへの push
        │
        ├──▶ verify ジョブ（lint / test / build）
        │
        └──▶ 承認待ち（production Environment）
                    │
                    ├──▶ backend ジョブ
                    │     ├── pnpm db:migrate    → Neon main（スキーマ適用）
                    │     ├── pnpm db:seed:demo  → Neon main（デモ曲を冪等投入）
                    │     ├── wrangler deploy --env production → Workers
                    │     │   （Environment secrets を wrangler secret put で同期）
                    │     └── ヘルスチェック（/api/health が 200 になるまで最大5回リトライ）
                    │
                    └──▶ frontend ジョブ
                          ├── pnpm exec next-on-pages
                          ├── wrangler pages deploy --project-name=chordbook-frontend --branch=main
                          └── wrangler pages secret put（ランタイム変数の同期）
```

手動で再実行したい場合は、Actions → **Deploy Production** → **Run workflow**（`main` ブランチを選択）。

---

## ロールバック

### バックエンド（Workers）

```bash
cd apps/backend
npx wrangler deployments list --env production   # 履歴を確認
npx wrangler rollback --env production           # 直前のバージョンへ
npx wrangler rollback <VERSION_ID> --env production
```

### フロントエンド（Pages）

Cloudflare ダッシュボード → **Workers & Pages** → `chordbook-frontend` → **Deployments** → 戻したいデプロイの **⋯** → **Rollback to this deployment**

### データベース

マイグレーションの自動ロールバックは用意していません（Drizzle は down マイグレーションを生成しない）。
**破壊的なスキーマ変更（カラム削除・型変更など）を本番へ適用する前には、Neon のブランチ機能でスナップショットを作成してください。**

```
Neon コンソール → Branches → Create Branch（親: main、名前: backup-YYYYMMDD）
```

問題が起きた場合は、そのブランチの接続文字列に一時的に切り替えるか、データを戻します。

---
