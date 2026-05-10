# 開発環境のセットアップ

ChordBook の開発環境を構築する手順を説明します。

## 必要なツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Node.js | 20以上 | フロントエンド・バックエンド実行環境 |
| pnpm | 10以上 | パッケージマネージャー（ワークスペース管理） |
| Docker Desktop | 最新 | ローカル PostgreSQL |
| Git | 最新 | バージョン管理 |

## インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/yasudaProduct/chord-chart.git
cd chord-chart
```

### 2. 依存関係のインストール

ルートディレクトリで一度実行するだけで、全ワークスペース（apps/frontend, apps/backend, packages/*）の依存関係がインストールされます。

```bash
pnpm install
```

### 3. フロントエンドの環境変数設定

```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

`apps/frontend/.env.local` を編集して必要な環境変数を設定します（詳細は[環境変数](../deployment/environments.md)を参照）。

### 4. バックエンドの環境変数設定

```bash
cp apps/backend/.env.example apps/backend/.env
```

`apps/backend/.env` を編集して必要な環境変数を設定します。

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/chordbook
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXX
ALLOWED_ORIGINS=http://localhost:3000
PORT=8080
```

### 5. ローカル PostgreSQL の起動

```bash
# ローカルDBを起動
docker compose up -d
```

## 開発サーバーの起動

### フロントエンド

```bash
pnpm dev:frontend
```

または `apps/frontend` ディレクトリで `pnpm dev` を実行しても同等です。

http://localhost:3000 でアクセスできます。

### バックエンド

```bash
pnpm dev:backend
```

または `apps/backend` ディレクトリで `pnpm dev` を実行しても同等です。

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
pnpm dev:frontend

# Lintチェック（ルートから全ワークスペース一括）
pnpm lint
pnpm lint:fix

# フォーマット確認・適用
pnpm format:check
pnpm format

# ビルド確認
pnpm --filter chordbook-frontend build
```

#### バックエンド

```bash
# 開発モードで実行（ホットリロード有効）
pnpm dev:backend

# テスト実行
pnpm --filter chordbook-backend test

# Lint
pnpm --filter chordbook-backend lint
```

## トラブルシューティング

### pnpm install が失敗する

```bash
# pnpm のキャッシュをクリア
pnpm store prune

# 全ワークスペースの node_modules を削除して再インストール
find . -name "node_modules" -type d -not -path "*/.git/*" | xargs rm -rf
pnpm install
```

### ポートが使用中

- フロントエンド: `PORT=3001 pnpm dev` で別ポートを指定
- バックエンド: `.env` の `PORT` を変更

## 次のステップ

- [コーディング規約](./coding-standards.md)を確認する
- [Git運用ルール](./git-workflow.md)を確認する
- [API仕様](../api/endpoints.md)を確認する
