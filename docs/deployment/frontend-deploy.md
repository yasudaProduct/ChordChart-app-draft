# フロントエンドデプロイ（Cloudflare Pages）

Next.js フロントエンドを `@cloudflare/next-on-pages` アダプター経由で Cloudflare Pages にデプロイする手順です。

> インフラ全体の構成は [インフラ構成概要](../infrastructure/overview.md) を参照してください。

## 前提条件

- GitHub アカウント
- Cloudflare アカウント
- Wrangler v4 系（`apps/frontend` の devDependencies に含まれる）
- リポジトリが GitHub にプッシュ済み

---

## ビルド設定

`@cloudflare/next-on-pages` で Next.js を Pages 向けにビルドします。出力は `.vercel/output/static` です。

| 項目               | 値                              |
| ------------------ | ------------------------------- |
| フレームワーク     | Next.js (App Router)            |
| ビルドコマンド     | `npx @cloudflare/next-on-pages` |
| 出力ディレクトリ   | `.vercel/output/static`         |
| Node.js バージョン | 20                              |
| ルートディレクトリ | `apps/frontend`                 |

**環境変数（Cloudflare Pages ダッシュボード）**

| 変数名                              | 値（例）                                                  |
| ----------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_XXXXXXXX`                                        |
| `CLERK_SECRET_KEY`                  | `sk_live_XXXXXXXX`                                        |
| `NEXT_PUBLIC_API_URL`               | `https://chordbook-api-staging.<account>.workers.dev/api` |

詳細は [docs/deployment/environments.md](./environments.md) を参照。

---

## 手動デプロイ（Wrangler）

```bash
cd apps/frontend

# Cloudflare 認証（初回のみ）
npx wrangler login

# Pages 向けにビルド
npx @cloudflare/next-on-pages

# デプロイ（package.json の deploy:staging スクリプト）
pnpm deploy:staging
# = wrangler pages deploy .vercel/output/static --project-name=chordbook-frontend-staging
```

デプロイ先プロジェクトは `chordbook-frontend-staging`（URL: `https://chordbook-frontend-staging.pages.dev`）。

---

## 自動デプロイ

`main` ブランチへのマージで GitHub 連携により自動デプロイされます。デプロイフローの全体像は [インフラ構成概要](../infrastructure/overview.md) を参照。

| ブランチ | 環境       |
| -------- | ---------- |
| main     | Production |
| その他   | Preview    |

---

## カスタムドメイン

Cloudflare ダッシュボード → Workers & Pages → 対象 Pages プロジェクト → **Custom domains** でドメイン（例: `chordbook.app`）を追加します。DNS は同一 Cloudflare アカウントなら自動設定されます。

---

## デプロイ状態・ログの確認

```bash
cd apps/frontend

# デプロイ一覧
npx wrangler pages deployment list --project-name=chordbook-frontend-staging
```

---

## トラブルシューティング

### ビルドエラー

```bash
# ローカルで Pages 向けビルドを確認
cd apps/frontend
npx @cloudflare/next-on-pages
```

よくある原因:

- TypeScript / ESLint エラー
- 環境変数の未設定（`NEXT_PUBLIC_` プレフィックスの付け忘れ）
- Edge Runtime 非対応 API の使用（`@cloudflare/next-on-pages` は Edge ランタイムが前提）

### 環境変数が反映されない

- `NEXT_PUBLIC_` プレフィックスを確認
- 再デプロイを実行
- ブラウザキャッシュをクリア

---

## 関連ドキュメント

- [インフラ構成概要](../infrastructure/overview.md) - サービス全体の構成
- [環境変数](./environments.md) - 環境変数一覧
- [バックエンドデプロイ](./backend-deploy.md) - Cloudflare Workers 設定
- [トラブルシューティング](./troubleshooting.md) - 問題解決
