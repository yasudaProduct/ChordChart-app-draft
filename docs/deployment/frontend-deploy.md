# フロントエンドデプロイ（Cloudflare Pages）

Next.js フロントエンドを `@cloudflare/next-on-pages` アダプター経由で Cloudflare Pages にデプロイする手順です。

> インフラ全体の構成は [インフラ構成概要](../infrastructure/overview.md) を参照してください。

## 前提条件

- GitHub アカウント
- Cloudflare アカウント
- Wrangler v4 系（`apps/frontend` の devDependencies に含まれる）
- リポジトリが GitHub にプッシュ済み

---

## プロジェクト構成

環境ごとに Pages プロジェクトを分けています。

| 環境         | Pages プロジェクト           | Production branch | URL                                            |
| ------------ | ---------------------------- | ----------------- | ---------------------------------------------- |
| ステージング | `chordbook-frontend-staging` | `develop`         | `https://chordbook-frontend-staging.pages.dev` |
| 本番         | `chordbook-frontend`         | `main`            | `https://chord-books.com`                        |

Pages は Workers のように設定ファイル側で環境を切り替えられないため、デプロイ時の `--project-name` フラグで指定します（フラグが `wrangler.toml` の `name` より優先されます）。事故が起きても軽いよう、`wrangler.toml` の既定値はステージング側にしてあります。

> プロジェクト作成時の **Production branch** の指定が重要です。デプロイ時の `--branch` がこれと一致しないと Preview デプロイ扱いになり、Production の環境変数が反映されません。
>
> ```bash
> npx wrangler pages project create chordbook-frontend --production-branch main
> ```

---

## ビルド設定

`@cloudflare/next-on-pages` で Next.js を Pages 向けにビルドします。出力は `.vercel/output/static` です。

| 項目               | 値                                   |
| ------------------ | ------------------------------------ |
| フレームワーク     | Next.js (App Router)                 |
| ビルドコマンド     | `pnpm build:cf`（= `next-on-pages`） |
| 出力ディレクトリ   | `.vercel/output/static`              |
| Node.js バージョン | 22（CI）/ 20 以上（ローカル）        |
| ルートディレクトリ | `apps/frontend`                      |

**環境変数**

| 変数名                              | 供給元（GitHub Environment secret） |
| ----------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `CLERK_PUBLISHABLE_KEY`             |
| `CLERK_SECRET_KEY`                  | `CLERK_SECRET_KEY`                  |
| `NEXT_PUBLIC_API_URL`               | `API_URL`                           |

ビルド時に埋め込まれるほか、デプロイ後に `wrangler pages secret put` でランタイム変数としても同期されます。詳細は [環境変数](./environments.md) を参照。

---

## 手動デプロイ（Wrangler）

```bash
cd apps/frontend

# Cloudflare 認証（初回のみ）
npx wrangler login

# Pages 向けにビルド（環境変数を渡す）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx \
CLERK_SECRET_KEY=sk_xxx \
NEXT_PUBLIC_API_URL=https://api.example.com/api \
  pnpm build:cf

# デプロイ
pnpm deploy:staging      # → chordbook-frontend-staging（--branch=develop）
pnpm deploy:production   # → chordbook-frontend（--branch=main）
```

---

## 自動デプロイ

| ブランチ  | 環境         | ワークフロー                              | 承認                       |
| --------- | ------------ | ----------------------------------------- | -------------------------- |
| `develop` | ステージング | `.github/workflows/deploy-staging.yml`    | なし                       |
| `main`    | 本番         | `.github/workflows/deploy-production.yml` | 必要（Required reviewers） |
| その他    | -            | 手動デプロイ時のみ                        | -                          |

どちらも共通の `.github/workflows/deploy.yml` を呼び出します。フロントエンド job の流れ:

1. 依存関係のインストール
2. `pnpm exec next-on-pages` — Environment secrets を環境変数として渡してビルド
3. `wrangler pages deploy` — 対象プロジェクトへデプロイ
4. `wrangler pages secret put` — ランタイム変数を同期

デプロイフローの全体像は [インフラ構成概要](../infrastructure/overview.md) を参照。

---

## カスタムドメイン

Cloudflare ダッシュボード → Workers & Pages → 対象 Pages プロジェクト → **Custom domains** でドメイン（本番は `chord-books.com`）を追加します。DNS は同一 Cloudflare アカウントなら自動設定されます。

apex ドメイン（`example.com`）を割り当てる場合、そのドメインが Cloudflare のゾーンとして管理されている必要があります。

---

## デプロイ状態・ログの確認

```bash
cd apps/frontend

# プロジェクト一覧（Production branch の確認）
npx wrangler pages project list

# デプロイ一覧
npx wrangler pages deployment list --project-name=chordbook-frontend-staging
npx wrangler pages deployment list --project-name=chordbook-frontend
```

### ロールバック

Cloudflare ダッシュボード → Workers & Pages → 対象プロジェクト → **Deployments** → 戻したいデプロイの **⋯** → **Rollback to this deployment**

---

## トラブルシューティング

### ビルドエラー

```bash
# ローカルで Pages 向けビルドを確認
cd apps/frontend
pnpm build:cf
```

よくある原因:

- TypeScript / ESLint エラー
- 環境変数の未設定（`NEXT_PUBLIC_` プレフィックスの付け忘れ）
- Edge Runtime 非対応 API の使用（`@cloudflare/next-on-pages` は Edge ランタイムが前提）

### 環境変数が反映されない

- `NEXT_PUBLIC_` プレフィックスを確認
- **デプロイが Preview 扱いになっていないか確認**（`--branch` がプロジェクトの Production branch と一致しているか）
- 再デプロイを実行
- ブラウザキャッシュをクリア

### デプロイ時に Pages API が 8000111 を返す

コミットメッセージに不正な UTF-8 が含まれると発生します。CI では `--commit-message` に ASCII の代替文字列を明示して回避しています。

---

## 関連ドキュメント

- [インフラ構成概要](../infrastructure/overview.md) - サービス全体の構成
- [本番環境セットアップ](../infrastructure/production-setup.md) - 本番の初回構築とデプロイフロー
- [環境変数](./environments.md) - 環境変数一覧
- [バックエンドデプロイ](./backend-deploy.md) - Cloudflare Workers 設定
- [トラブルシューティング](./troubleshooting.md) - 問題解決
