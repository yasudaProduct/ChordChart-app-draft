# 環境変数

ChordBook の環境変数一覧と設定方法です。

## フロントエンド（Next.js）

### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| NEXT_PUBLIC_SUPABASE_URL | Supabase プロジェクトURL | https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名キー | eyJhbGciOiJIUzI1NiIsInR5cCI... |
| NEXT_PUBLIC_API_URL | バックエンドAPI URL | http://localhost:8080/api |

### 設定方法

#### ローカル開発

`.env.local` ファイルを作成:

```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase status で表示される anon key>
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
| DATABASE_URL | PostgreSQL 接続文字列 | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| SUPABASE_URL | Supabase URL（JWT検証用） | http://127.0.0.1:54321 |
| ALLOWED_ORIGINS | CORS 許可オリジン（カンマ区切り） | http://localhost:3000 |

### オプション環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| PORT | サーバーポート | 8080 |

### 設定方法

#### ローカル開発

`.env` ファイルを作成:

```bash
# backend-hono/.env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

#### Railway（本番）

Railway ダッシュボードで設定:
1. プロジェクト → Variables
2. 各変数を追加

```
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://xxx.supabase.co
ALLOWED_ORIGINS=https://chordbook.vercel.app
PORT=8080
```

---

## Supabase 設定

Supabase ダッシュボードから以下の情報を取得:

### Project Settings → API

| 項目 | 用途 |
|------|------|
| Project URL | NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL |
| anon (public) key | NEXT_PUBLIC_SUPABASE_ANON_KEY |

### Project Settings → Database

| 項目 | 用途 |
|------|------|
| Connection string (URI) | DATABASE_URL |

接続文字列の形式:
```
postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
```

---

## 環境別設定一覧

### 開発環境（Development）

| サービス | 設定値 |
|----------|--------|
| フロントエンド URL | http://localhost:3000 |
| バックエンド URL | http://localhost:8080 |
| データベース | localhost:54322（ローカル Supabase） |
| CORS | http://localhost:3000 |

### 本番環境（Production）

| サービス | 設定値 |
|----------|--------|
| フロントエンド URL | https://chordbook.vercel.app |
| バックエンド URL | https://chordbook-api.railway.app |
| データベース | Supabase PostgreSQL |
| CORS | https://chordbook.vercel.app |

---

## セキュリティ注意事項

1. **秘密情報をコミットしない**
   - `.env.local` / `.env` は `.gitignore` に含まれている
   - `.env.example` には実際の値を入れない

2. **NEXT_PUBLIC_ プレフィックス**
   - このプレフィックスの変数はブラウザに公開される
   - 秘密情報には使用しない

3. **接続文字列**
   - 本番環境では SSL 接続を有効にする
   - `?sslmode=require` を追加

```
postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres?sslmode=require
```

## 関連ドキュメント

- [フロントエンドデプロイ](./frontend-deploy.md) - Vercel 設定
- [バックエンドデプロイ](./backend-deploy.md) - Railway 設定
- [環境構築](../development/getting-started.md) - ローカル開発
