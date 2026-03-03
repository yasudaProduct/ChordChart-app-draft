# バックエンドデプロイ（Railway）

Hono (TypeScript) バックエンドを Railway にデプロイする手順です。

## 前提条件

- GitHub アカウント
- Railway アカウント
- リポジトリが GitHub にプッシュ済み

---

## 初回セットアップ

### 1. Railway にログイン

[railway.app](https://railway.app) にアクセスし、GitHub アカウントでログイン。

### 2. 新規プロジェクト作成

1. **New Project** をクリック
2. **Deploy from GitHub repo** を選択
3. リポジトリを選択

### 3. サービス設定

| 項目 | 値 |
|------|-----|
| Root Directory | apps/backend-hono |
| Build Command | pnpm build |
| Start Command | pnpm start |

### 4. 環境変数の設定

**Variables** タブで以下を追加:

| 変数名 | 値 |
|--------|-----|
| DATABASE_URL | postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres |
| SUPABASE_URL | https://xxx.supabase.co |
| ALLOWED_ORIGINS | https://chordbook.vercel.app |
| PORT | 8080 |

### 5. デプロイ

設定保存後、自動的にビルド・デプロイが開始されます。

---

## 環境変数の詳細

### DATABASE_URL

Supabase PostgreSQL への接続文字列:

```
postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
```

| パラメータ | 説明 |
|-----------|------|
| ユーザー名 | `postgres` |
| パスワード | Supabase のデータベースパスワード |
| ホスト | `db.xxx.supabase.co` |
| ポート | `5432` |
| データベース | `postgres` |

SSL 接続が必要な場合:
```
postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### SUPABASE_URL

JWT 検証に使用する Supabase のプロジェクト URL:

```
https://xxx.supabase.co
```

### ALLOWED_ORIGINS

CORS 許可オリジン（カンマ区切り）:

```
https://chordbook.vercel.app
```

複数オリジンの場合:
```
https://chordbook.vercel.app,https://preview.chordbook.vercel.app
```

---

## 自動デプロイ

GitHub 連携により自動デプロイ:

| ブランチ | 動作 |
|----------|------|
| main | 自動デプロイ |
| その他 | 手動デプロイ |

### トリガー設定

1. プロジェクト設定 → **Deployments**
2. **Watch Paths** で `apps/backend-hono/**` を設定

---

## ドメイン設定

### Railway 提供ドメイン

デフォルトで `xxx.railway.app` が割り当てられます。

### カスタムドメイン

1. Settings → **Domains**
2. **Custom Domain** を追加
3. DNS の CNAME レコードを設定

---

## ヘルスチェック

Railway は自動でヘルスチェックを行います。

エンドポイント: `GET /api/health`

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## スケーリング

### リソース設定

Settings → **Resources**:

| 項目 | 推奨値 |
|------|--------|
| Memory | 256MB - 512MB |
| CPU | 0.5 - 1 vCPU |

### 自動スリープ

無料プランでは非アクティブ時にスリープします。
初回リクエスト時にコールドスタートが発生。

---

## ログ確認

### デプロイログ

1. プロジェクト → **Deployments**
2. 対象のデプロイを選択
3. **Build Logs** / **Deploy Logs** を確認

### ランタイムログ

1. サービス → **Logs** タブ
2. リアルタイムでログを確認

```bash
# Railway CLI でログ確認
railway logs
```

---

## Railway CLI

### インストール

```bash
npm i -g @railway/cli
```

### 使用方法

```bash
# ログイン
railway login

# プロジェクト連携
railway link

# ローカルで環境変数を使って実行
railway run pnpm dev

# デプロイ
railway up
```

---

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルド確認
cd apps/backend-hono
pnpm build
pnpm start
```

### 接続エラー

- 環境変数の確認
- Supabase の接続許可 IP を確認
- SSL 設定を確認

### ポートエラー

Railway は `PORT` 環境変数でポートを指定:

```typescript
// index.ts
const port = process.env.PORT || "8080";
serve({ fetch: app.fetch, port: Number(port) });
```

---

## 関連ドキュメント

- [環境変数](./environments.md) - 環境変数一覧
- [フロントエンドデプロイ](./frontend-deploy.md) - Vercel設定
- [トラブルシューティング](./troubleshooting.md) - 問題解決
