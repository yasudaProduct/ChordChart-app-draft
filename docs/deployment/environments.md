# 環境変数

ChordBook の環境変数一覧と設定方法です。

## フロントエンド（Next.js）

### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk 公開キー | pk_test_XXXXXXXX |
| CLERK_SECRET_KEY | Clerk シークレットキー | sk_test_XXXXXXXX |
| NEXT_PUBLIC_API_URL | バックエンドAPI URL | http://localhost:8080/api |

### 設定方法

#### ローカル開発

`.env.local` ファイルを作成:

```bash
# frontend/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXX
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

#### Vercel（本番）

Vercel ダッシュボードで設定:
1. Project Settings → Environment Variables
2. 各変数を追加（Production/Preview/Development を選択可能）

---

## バックエンド（Hono）

### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| DATABASE_URL | PostgreSQL 接続文字列 | postgresql://postgres:postgres@127.0.0.1:5432/chordbook |
| CLERK_ISSUER | Clerk Issuer URL（JWT検証用） | https://xxx.clerk.accounts.dev |
| CLERK_WEBHOOK_SECRET | Clerk Webhook 署名検証シークレット | whsec_XXXXXXXX |
| ALLOWED_ORIGINS | CORS 許可オリジン（カンマ区切り） | http://localhost:3000 |

### オプション環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| PORT | サーバーポート | 8080 |

### 設定方法

#### ローカル開発

`.env` ファイルを作成:

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/chordbook
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXX
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

#### Railway（本番）

Railway ダッシュボードで設定:
1. プロジェクト → Variables
2. 各変数を追加

```
DATABASE_URL=postgresql://postgres:xxx@db.xxx.neon.tech:5432/chordbook?sslmode=require
CLERK_ISSUER=https://xxx.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXX
ALLOWED_ORIGINS=https://chordbook.vercel.app
PORT=8080
```

---

## Clerk 設定

Clerk ダッシュボードから以下の情報を取得:

### Configure → API Keys

| 項目 | 用途 |
|------|------|
| Publishable Key | NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY |
| Secret Key | CLERK_SECRET_KEY |

### Configure → Webhooks

Webhook エンドポイントを登録し、以下のイベントを有効化:
- `user.created`
- `user.updated`
- `user.deleted`

エンドポイント URL: `https://your-api.railway.app/api/webhooks/clerk`

Webhook シークレットを `CLERK_WEBHOOK_SECRET` に設定。

---

## 環境別設定一覧

### 開発環境（Development）

| サービス | 設定値 |
|----------|--------|
| フロントエンド URL | http://localhost:3000 |
| バックエンド URL | http://localhost:8080 |
| データベース | localhost:5432（Docker PostgreSQL） |
| CORS | http://localhost:3000 |

### 本番環境（Production）

| サービス | 設定値 |
|----------|--------|
| フロントエンド URL | https://chordbook.vercel.app |
| バックエンド URL | https://chordbook-api.railway.app |
| データベース | Neon PostgreSQL |
| CORS | https://chordbook.vercel.app |

---

## セキュリティ注意事項

1. **秘密情報をコミットしない**
   - `.env.local` / `.env` は `.gitignore` に含まれている
   - `.env.example` には実際の値を入れない

2. **NEXT_PUBLIC_ プレフィックス**
   - このプレフィックスの変数はブラウザに公開される
   - 秘密情報には使用しない（`CLERK_SECRET_KEY` は `NEXT_PUBLIC_` なし）

3. **接続文字列**
   - 本番環境では SSL 接続を有効にする
   - `?sslmode=require` を追加

```
postgresql://postgres:xxx@db.xxx.neon.tech:5432/chordbook?sslmode=require
```

## 関連ドキュメント

- [フロントエンドデプロイ](./frontend-deploy.md) - Vercel 設定
- [バックエンドデプロイ](./backend-deploy.md) - Railway 設定
- [環境構築](../development/getting-started.md) - ローカル開発
