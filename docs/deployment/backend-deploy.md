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

デプロイ設定は `apps/backend/wrangler.toml` で管理します。

```toml
name = "chordbook-api-staging"
main = "src/worker.ts"
compatibility_date = "2025-04-15"
compatibility_flags = ["nodejs_compat"]

[vars]
ALLOWED_ORIGINS = "https://chordbook-frontend-staging.pages.dev,http://localhost:3000"
# Cloudflare Workers では neon-http を使用（postgres.js の request 間 I/O 共有を回避）
DATABASE_DRIVER = "neon-http"

# 以下はシークレット（wrangler secret put または GitHub Actions secrets で設定する）
# DATABASE_URL
# CLERK_ISSUER
# CLERK_WEBHOOK_SECRET
```

- エントリポイントは `src/worker.ts`（`export default app` で Workers にエクスポート）。
- `[vars]` は公開してよい設定値。秘匿情報は `wrangler secret` で登録する。

---

## 初回セットアップ

### 1. Wrangler にログイン

```bash
cd apps/backend
npx wrangler login        # ブラウザで Cloudflare 認証
npx wrangler whoami       # ログイン中のアカウントを確認
```

### 2. シークレットの登録

`wrangler.toml` には書かず、`wrangler secret` で登録します（値はプロンプトで安全に入力）。

```bash
cd apps/backend
npx wrangler secret put DATABASE_URL
npx wrangler secret put CLERK_ISSUER
npx wrangler secret put CLERK_WEBHOOK_SECRET

# 登録済みシークレットの一覧
npx wrangler secret list
```

詳細は [docs/deployment/environments.md](./environments.md) を参照。

### 3. デプロイ

```bash
cd apps/backend
pnpm deploy:staging        # = wrangler deploy

# デプロイ前に設定だけ検証したい場合
npx wrangler deploy --dry-run
```

---

## 自動デプロイ

`develop` ブランチへのプッシュで `.github/workflows/deploy-staging.yml` が実行されます。

バックエンド job の流れ:

1. 依存関係のインストール
2. `pnpm db:migrate` — `STAGING_DATABASE_URL` を使い Neon にマイグレーション適用
3. `pnpm db:seed:demo` — デモ曲を冪等投入（非破壊）
4. `wrangler deploy` — Cloudflare Workers へデプロイ

スキーマ変更時は `pnpm db:generate` でマイグレーションファイルを生成し、コミットしてから `develop` へプッシュしてください。詳細は [ステージング環境セットアップ](../infrastructure/staging-setup.md) を参照。

---

## ドメイン設定

### Workers 提供ドメイン

デフォルトで `<name>.<account>.workers.dev` が割り当てられます（例: `chordbook-api-staging.<account>.workers.dev`）。

### カスタムドメイン

Cloudflare ダッシュボード → Workers & Pages → 対象 Worker → **Settings → Domains & Routes** でカスタムドメイン（例: `api.chordbook.app`）を追加します。

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

```bash
cd apps/backend

# 認証アカウント
npx wrangler whoami

# デプロイ履歴 / バージョン一覧
npx wrangler deployments list
npx wrangler versions list

# ライブログ（稼働中 Worker にリクエストが来たときに流れる）
npx wrangler tail
npx wrangler tail --status error      # エラーのみ
npx wrangler tail --format json       # JSON 出力
```

### ロールバック

```bash
npx wrangler rollback                 # 直前のバージョンへ
npx wrangler rollback <VERSION_ID>    # 指定バージョンへ
```

---

## トラブルシューティング

### ビルド / デプロイエラー

```bash
# 設定とバンドルを検証（デプロイはしない）
cd apps/backend
npx wrangler deploy --dry-run
```

### 接続エラー

- シークレット（`DATABASE_URL` 等）が登録済みか `wrangler secret list` で確認
- Neon 接続文字列の SSL 設定（`?sslmode=require`）を確認
- Workers では `DATABASE_DRIVER = "neon-http"` を使用しているか確認（`postgres-js` は Workers では不可）

---

## 関連ドキュメント

- [インフラ構成概要](../infrastructure/overview.md) - サービス全体の構成
- [環境変数](./environments.md) - 環境変数一覧
- [フロントエンドデプロイ](./frontend-deploy.md) - Cloudflare Pages 設定
- [トラブルシューティング](./troubleshooting.md) - 問題解決
