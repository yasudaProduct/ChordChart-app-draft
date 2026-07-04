# ChordBook

コード譜を作成・管理・共有できるWebアプリケーション

## 概要

既存のコード掲載サイトの不満（広告、見づらさ、印刷品質）を解消し、オリジナル曲も含めてコード譜を一元管理できるサービス。

## 技術スタック

| レイヤー       | 技術                                                       |
| -------------- | ---------------------------------------------------------- |
| フロントエンド | Next.js 14 (App Router), Tailwind CSS, SWR, Zustand, Clerk |
| バックエンド   | Hono, Drizzle ORM, Zod, jose (JWT検証)                     |
| データベース   | PostgreSQL (Neon)                                          |
| 認証           | Clerk                                                      |
| ホスティング   | Cloudflare Pages (FE), Cloudflare Workers (BE)             |

## プロジェクト構成

```
chord-chart/
├── apps/
│   ├── frontend/        # Next.js フロントエンド
│   └── backend/         # Hono バックエンド (TypeScript)
├── packages/
│   ├── eslint-config/   # 共有 ESLint 設定 (@chordbook/eslint-config)
│   └── prettier-config/ # 共有 Prettier 設定 (@chordbook/prettier-config)
├── docs/                # ドキュメント
└── .github/             # GitHub Actions
```

## 開発環境のセットアップ

### 前提条件

- Node.js 20+
- pnpm
- Docker Desktop（ローカル PostgreSQL 用）

### 1. リポジトリのクローン

```bash
git clone https://github.com/yasudaProduct/chord-chart.git
cd chord-chart
```

### 2. ローカル PostgreSQL の起動

```bash
docker compose up -d
```

### 3. 依存関係のインストール

ルートディレクトリで一度実行するだけで全ワークスペースにインストールされます。

```bash
pnpm install
```

### 4. フロントエンドの環境変数設定

```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

`apps/frontend/.env.local` に Clerk のキーを設定します。

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXX
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 5. バックエンドの環境変数設定

```bash
cp apps/backend/.env.example apps/backend/.env
```

`apps/backend/.env` に Clerk の Issuer URL を設定します。

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/chordbook
DATABASE_DRIVER=postgres-js
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

### 6. DBスキーマの適用

```bash
pnpm --filter chordbook-backend db:push
```

### 7. 開発サーバーの起動

バックエンドとフロントエンドをそれぞれ別のターミナルで起動します。

```bash
# ターミナル1: バックエンド
pnpm dev:backend
# http://localhost:8080
```

```bash
# ターミナル2: フロントエンド
pnpm dev:frontend
# http://localhost:3000
```

### 8. Clerk Webhook のローカル開発（ngrok）

Clerk の Webhook をローカル環境で受け取るために ngrok を使用します。

#### ngrok のインストール

```bash
# macOS (Homebrew)
brew install ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

#### ngrok のセットアップ

```bash
# ngrok にサインアップ後、認証トークンを設定
ngrok config add-authtoken <your-authtoken>
```

#### ローカル開発での使い方

```bash
# 1. バックエンドサーバーを起動（ターミナル1）
cd apps/backend
pnpm dev

# 2. ngrok でバックエンドをトンネリング（ターミナル2）
ngrok http 8080
```

ngrok が起動すると、以下のような公開URLが表示されます。

```
Forwarding  https://xxxx-xxx-xxx.ngrok-free.app -> http://localhost:8080
```

#### Clerk Webhook の設定

1. [Clerk Dashboard](https://dashboard.clerk.com) を開く
2. **Configure** → **Webhooks** → **Add Endpoint**
3. **Endpoint URL** に ngrok の URL + パスを入力:
   ```
   https://xxxx-xxx-xxx.ngrok-free.app/api/webhooks/clerk
   ```
4. **Subscribe to events** で以下を選択:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. **Create** をクリック
6. 作成後に表示される **Signing Secret** を `apps/backend/.env` の `CLERK_WEBHOOK_SECRET` に設定

> **注意:** ngrok の無料プランでは起動するたびに URL が変わるため、再起動時は Clerk Dashboard の Webhook URL も更新してください。固定ドメインを使いたい場合は `ngrok http --domain=your-domain.ngrok-free.app 8080` を使用します（無料プランでも1つ利用可能）。

### コード品質チェック

```bash
# Lint（全ワークスペース一括）
pnpm lint
pnpm lint:fix

# フォーマット（全ワークスペース一括）
pnpm format:check
pnpm format
```

### デモモード

バックエンドを起動せずにフロントエンドのみでも動作します。未ログイン状態ではローカルのモックデータを使用したデモモードで動作します。

## デプロイ（Cloudflare）

バックエンドは Cloudflare Workers、フロントエンドは Cloudflare Pages にデプロイします。CLI には [Wrangler](https://developers.cloudflare.com/workers/wrangler/)（v4 系、各アプリの devDependencies に同梱）を使用します。

> 詳細手順は [バックエンドデプロイ](docs/deployment/backend-deploy.md) / [フロントエンドデプロイ](docs/deployment/frontend-deploy.md) を参照。

### 認証

```bash
npx wrangler login    # ブラウザで Cloudflare 認証（初回のみ）
npx wrangler whoami   # ログイン中のアカウントを確認
```

### バックエンド（Cloudflare Workers）

```bash
cd apps/backend

# シークレットの登録（値はプロンプトで安全に入力）
npx wrangler secret put DATABASE_URL
npx wrangler secret put CLERK_ISSUER
npx wrangler secret put CLERK_WEBHOOK_SECRET
npx wrangler secret list             # 登録済みシークレット一覧

# デプロイ
pnpm deploy:staging                  # = wrangler deploy
npx wrangler deploy --dry-run        # 設定だけ検証（デプロイしない）
```

### フロントエンド（Cloudflare Pages）

```bash
cd apps/frontend

# Pages 向けにビルドしてデプロイ
pnpm build:cf
pnpm deploy:staging
# = wrangler pages deploy .vercel/output/static --project-name=chordbook-frontend-staging
```

### デプロイ状態・ログの確認

```bash
cd apps/backend

# デプロイ履歴 / バージョン一覧
npx wrangler deployments list
npx wrangler versions list

# ライブログ（稼働中 Worker にリクエストが来たときに流れる）
npx wrangler tail
npx wrangler tail --status error     # エラーのみ
npx wrangler tail --format json      # JSON 出力

# Pages のデプロイ一覧
cd ../frontend
npx wrangler pages deployment list --project-name=chordbook-frontend-staging
```

### ロールバック

```bash
cd apps/backend
npx wrangler rollback                # 直前のバージョンへ
npx wrangler rollback <VERSION_ID>   # 指定バージョンへ
```

## ライセンス

MIT
