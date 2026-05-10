# フロントエンドデプロイ（Vercel）

Next.js フロントエンドを Vercel にデプロイする手順です。

## 前提条件

- GitHub アカウント
- Vercel アカウント
- リポジトリが GitHub にプッシュ済み

---

## 初回セットアップ

### 1. Vercel にログイン

[vercel.com](https://vercel.com) にアクセスし、GitHub アカウントでログイン。

### 2. プロジェクトのインポート

1. **Add New** → **Project** をクリック
2. **Import Git Repository** でリポジトリを選択
3. **Root Directory** を `apps/frontend` に設定

### 3. ビルド設定

| 項目 | 値 |
|------|-----|
| Framework Preset | Next.js |
| Root Directory | apps/frontend |
| Build Command | pnpm build |
| Install Command | pnpm install |
| Output Directory | .next |

### 4. 環境変数の設定

**Environment Variables** セクションで以下を追加:

| 変数名 | 値 |
|--------|-----|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | pk_live_XXXXXXXX |
| CLERK_SECRET_KEY | sk_live_XXXXXXXX |
| NEXT_PUBLIC_API_URL | https://api.chordbook.railway.app/api |

### 5. デプロイ

**Deploy** をクリック。初回ビルドが開始されます。

---

## 自動デプロイ

GitHub 連携により自動デプロイが設定されます:

| ブランチ | 環境 | URL |
|----------|------|-----|
| main | Production | chordbook.vercel.app |
| その他 | Preview | chordbook-xxx-user.vercel.app |

### トリガー

- **main へのプッシュ** → Production デプロイ
- **PR 作成** → Preview デプロイ

---

## 手動デプロイ

### Vercel CLI

```bash
# CLI インストール
npm i -g vercel

# ログイン
vercel login

# デプロイ（Preview）
cd apps/frontend
vercel

# デプロイ（Production）
vercel --prod
```

---

## 環境の管理

### 環境の種類

| 環境 | 説明 |
|------|------|
| Production | 本番環境（main ブランチ） |
| Preview | PR・ブランチごとのプレビュー |
| Development | ローカル開発 |

### 環境変数の設定

1. Project Settings → Environment Variables
2. 変数を追加
3. 適用環境を選択（Production / Preview / Development）

```
NEXT_PUBLIC_API_URL
├── Production: https://api.chordbook.railway.app/api
├── Preview: https://api-staging.chordbook.railway.app/api
└── Development: http://localhost:5000/api
```

---

## カスタムドメイン

### 設定手順

1. Project Settings → Domains
2. ドメイン名を入力（例: `chordbook.example.com`）
3. DNS 設定を行う

### DNS 設定

| タイプ | 名前 | 値 |
|--------|------|-----|
| CNAME | chordbook | cname.vercel-dns.com |

または

| タイプ | 名前 | 値 |
|--------|------|-----|
| A | @ | 76.76.21.21 |

---

## ビルド最適化

### キャッシュ

Vercel は自動的に以下をキャッシュ:
- node_modules
- .next/cache

### ビルド時間の短縮

```javascript
// next.config.js
module.exports = {
  // 不要なページを除外
  pageExtensions: ['tsx', 'ts'],

  // 画像最適化
  images: {
    domains: ['img.clerk.com'],
  },
}
```

---

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドを確認
cd apps/frontend
pnpm build
```

よくある原因:
- TypeScript エラー
- 環境変数の未設定
- 依存関係のバージョン不整合

### 環境変数が反映されない

- `NEXT_PUBLIC_` プレフィックスを確認
- 再デプロイを実行
- ブラウザキャッシュをクリア

### デプロイ後に404

- `next.config.js` の設定を確認
- 動的ルートの設定を確認

---

## 監視

### Analytics

Vercel Analytics で以下を確認:
- Core Web Vitals
- ページビュー
- 訪問者数

### Logs

Functions ログで API Routes のエラーを確認:
1. Project → Deployments → 対象のデプロイ
2. **Functions** タブ

---

## 関連ドキュメント

- [環境変数](./environments.md) - 環境変数一覧
- [バックエンドデプロイ](./backend-deploy.md) - Railway設定
- [トラブルシューティング](./troubleshooting.md) - 問題解決
