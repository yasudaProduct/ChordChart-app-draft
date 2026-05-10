# 開発環境のセットアップ

ChordBook の開発環境を構築する手順を説明します。

## 必要なツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Node.js | 20以上 | フロントエンド・バックエンド実行環境 |
| pnpm | 8以上 | パッケージマネージャー |
| Docker Desktop | 最新 | ローカル PostgreSQL |
| Git | 最新 | バージョン管理 |

## インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/yasudaProduct/chord-chart.git
cd chord-chart
```

### 2. フロントエンドのセットアップ

```bash
cd apps/frontend

# 依存関係のインストール
pnpm install

# 環境変数ファイルの作成
cp .env.local.example .env.local
```

`.env.local` を編集して必要な環境変数を設定します（詳細は[環境変数](../deployment/environments.md)を参照）。

### 3. バックエンドのセットアップ

```bash
cd apps/backend

# 依存関係のインストール
pnpm install

# 環境変数ファイルの作成
cp .env.example .env
```

`.env` を編集して必要な環境変数を設定します。

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/chordbook
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXX
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

### 4. ローカル PostgreSQL の起動

```bash
# ローカルDBを起動
docker compose up -d
```

## 開発サーバーの起動

### フロントエンド

```bash
cd apps/frontend
pnpm dev
```

http://localhost:3000 でアクセスできます。

### バックエンド

```bash
cd apps/backend
pnpm dev
```

http://localhost:8080 でアクセスできます。

## 開発ツール

### 推奨エディタ

- **VS Code**
  - 推奨拡張機能: ESLint, Prettier, Tailwind CSS IntelliSense, REST Client

### API テスト

VS Code の REST Client 拡張機能を使用:

```
apps/backend/.http/
├── auth.http     # 認証テスト
└── songs.http    # Song CRUD
```

### デバッグ

#### フロントエンド

```bash
# 開発サーバー（ホットリロード有効）
pnpm dev

# Lintチェック
pnpm lint

# ビルド確認
pnpm build
```

#### バックエンド

```bash
# 開発モードで実行（ホットリロード有効）
cd apps/backend
pnpm dev

# テスト実行
pnpm test
```

## トラブルシューティング

### pnpm install が失敗する

```bash
# pnpm のキャッシュをクリア
pnpm store prune

# node_modules を削除して再インストール
rm -rf node_modules
pnpm install
```

### ポートが使用中

- フロントエンド: `PORT=3001 pnpm dev` で別ポートを指定
- バックエンド: `.env` の `PORT` を変更

## 次のステップ

- [コーディング規約](./coding-standards.md)を確認する
- [Git運用ルール](./git-workflow.md)を確認する
- [API仕様](../api/endpoints.md)を確認する
