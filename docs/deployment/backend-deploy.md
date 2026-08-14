# バックエンドデプロイ（Cloudflare Workers）

Hono (TypeScript) バックエンドを Cloudflare Workers にデプロイする手順です。

> インフラ全体の構成は [インフラ構成概要](../infrastructure/overview.md) を参照してください。

## 前提条件

- GitHub アカウント
- Cloudflare アカウント
- Wrangler v4 系（`apps/backend` の devDependencies に含まれる）
- リポジトリが GitHub にプッシュ済み

---

## 設定ファイル

デプロイ設定は `apps/backend/wrangler.toml` で管理します。環境は `[env.staging]` / `[env.production]` に分離しています。

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

- エントリポイントは `src/worker.ts`（`export default app` で Workers にエクスポート）。
- `vars` は公開してよい設定値。秘匿情報は `wrangler secret` で登録する。
- **`vars` / `secrets` は環境に継承されない**ため、環境ごとに定義する必要がある。
- デプロイは必ず `--env` を付ける。付け忘れると top-level の `chordbook-api` という別 Worker が新規作成される。

---

## 初回セットアップ

### 1. Wrangler にログイン

```bash
cd apps/backend
npx wrangler login        # ブラウザで Cloudflare 認証
npx wrangler whoami       # ログイン中のアカウントを確認
```

### 2. シークレットの登録

`wrangler.toml` には書かず、`wrangler secret` で環境ごとに登録します（値はプロンプトで安全に入力）。

```bash
cd apps/backend

# ステージング
npx wrangler secret put DATABASE_URL --env staging
npx wrangler secret put CLERK_ISSUER --env staging
npx wrangler secret put CLERK_WEBHOOK_SECRET --env staging

# 本番
npx wrangler secret put DATABASE_URL --env production
npx wrangler secret put CLERK_ISSUER --env production
npx wrangler secret put CLERK_WEBHOOK_SECRET --env production

# 登録済みシークレットの一覧
npx wrangler secret list --env production
```

> 2 回目以降は GitHub Actions が Environment secrets の値を `wrangler secret put` で自動同期します。値を変えたいときは GitHub 側を更新して再デプロイしてください。

詳細は [環境変数](./environments.md) を参照。

### 3. デプロイ

```bash
cd apps/backend
pnpm deploy:staging        # = wrangler deploy --env staging
pnpm deploy:production     # = wrangler deploy --env production

# デプロイ前に設定だけ検証したい場合
npx wrangler deploy --env production --dry-run
```

---

## 自動デプロイ

| ブランチ  | 環境         | ワークフロー                              | 承認                       |
| --------- | ------------ | ----------------------------------------- | -------------------------- |
| `develop` | ステージング | `.github/workflows/deploy-staging.yml`    | なし                       |
| `main`    | 本番         | `.github/workflows/deploy-production.yml` | 必要（Required reviewers） |

どちらも共通の `.github/workflows/deploy.yml` を呼び出します。バックエンド job の流れ:

1. 依存関係のインストール
2. `pnpm db:migrate` — Environment secret の `DATABASE_URL` を使い Neon にマイグレーション適用
3. `pnpm db:seed:demo` — デモ曲を冪等投入（非破壊）
4. `wrangler deploy --env <環境>` — Cloudflare Workers へデプロイ（同時にシークレットを同期）
5. `GET /api/health` が 200 を返すことを確認（最大 5 回リトライ）

スキーマ変更時は `pnpm db:generate` でマイグレーションファイルを生成し、コミットしてからプッシュしてください。初回構築手順は [ステージング環境セットアップ](../infrastructure/staging-setup.md) / [本番環境セットアップ](../infrastructure/production-setup.md) を参照。

---

## ドメイン設定

### Workers 提供ドメイン

デフォルトで `<name>.<account>.workers.dev` が割り当てられます（例: `chordbook-api-staging.<account>.workers.dev`）。

### カスタムドメイン

Cloudflare ダッシュボード → Workers & Pages → 対象 Worker → **Settings → Domains & Routes** でカスタムドメイン（本番は `api.chord-books.com`）を追加します。

---

## ヘルスチェック

エンドポイント: `GET /api/health`

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## デプロイ状態・ログの確認

環境ごとに Worker が分かれているため、`--env` を付けて対象を指定します。

```bash
cd apps/backend

# 認証アカウント
npx wrangler whoami

# デプロイ履歴 / バージョン一覧
npx wrangler deployments list --env production
npx wrangler versions list --env production

# ライブログ（稼働中 Worker にリクエストが来たときに流れる）
npx wrangler tail --env production
npx wrangler tail --env production --status error      # エラーのみ
npx wrangler tail --env production --format json       # JSON 出力
```

### ロールバック

```bash
npx wrangler rollback --env production                 # 直前のバージョンへ
npx wrangler rollback <VERSION_ID> --env production    # 指定バージョンへ
```

DB マイグレーションは自動ロールバックできません。破壊的変更の前に Neon でバックアップブランチを作成してください（[本番環境セットアップ](../infrastructure/production-setup.md) の「ロールバック」）。

---

## トラブルシューティング

### ビルド / デプロイエラー

```bash
# 設定とバンドルを検証（デプロイはしない）
cd apps/backend
npx wrangler deploy --env production --dry-run
```

### 接続エラー

- シークレット（`DATABASE_URL` 等）が対象環境に登録済みか `wrangler secret list --env <環境>` で確認
- Neon 接続文字列の SSL 設定（`?sslmode=require`）を確認
- Workers では `DATABASE_DRIVER = "neon-http"` を使用しているか確認（`postgres-js` は Workers では不可）

### 意図しない Worker が作られた

`--env` を付けずに `wrangler deploy` すると、top-level の `chordbook-api` が作成されます。不要な場合は削除してください。

```bash
npx wrangler delete --name chordbook-api
```

---

## 関連ドキュメント

- [インフラ構成概要](../infrastructure/overview.md) - サービス全体の構成
- [本番環境セットアップ](../infrastructure/production-setup.md) - 本番の初回構築とデプロイフロー
- [環境変数](./environments.md) - 環境変数一覧
- [フロントエンドデプロイ](./frontend-deploy.md) - Cloudflare Pages 設定
- [トラブルシューティング](./troubleshooting.md) - 問題解決
