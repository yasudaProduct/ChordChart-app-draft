# トラブルシューティング

ChordBook でよくある問題と解決方法です。

---

## 開発環境

### フロントエンドが起動しない

**症状**: `pnpm dev` でエラー

**確認事項**:

```bash
# Node.js バージョン確認
node --version  # 20以上が必要

# 依存関係の再インストール
rm -rf node_modules
pnpm install
```

**よくある原因**:

- Node.js バージョンが古い
- node_modules の破損
- 環境変数ファイルがない

---

### バックエンドが起動しない

**症状**: `pnpm dev` でエラー

**確認事項**:

```bash
# Node.js バージョン確認
node --version  # 20以上が必要

# 依存関係の再インストール
cd apps/backend
rm -rf node_modules
pnpm install
```

**よくある原因**:

- `.env` ファイルが存在しない（`.env.example` からコピー）
- `DATABASE_URL` が未設定または不正
- `CLERK_ISSUER` が未設定
- Docker PostgreSQL が起動していない（`docker compose up -d`）

---

### データベース接続エラー

**症状**: サーバー起動時にDB接続エラー

**確認事項**:

1. Docker PostgreSQL が起動しているか: `docker compose ps`
2. `DATABASE_URL` の値が正しいか

**接続文字列の例（ローカル）**:

```
postgresql://postgres:postgres@127.0.0.1:5432/chordbook
```

**接続文字列の例（本番）**:

```
postgresql://postgres:xxx@db.xxx.neon.tech:5432/chordbook?sslmode=require
```

---

### CORS エラー

**症状**: ブラウザコンソールに `CORS policy` エラー

**確認事項**:

1. `ALLOWED_ORIGINS` の設定を確認
2. プロトコル（http/https）が一致しているか
3. ポート番号が一致しているか

**解決方法**:

```bash
# .env
ALLOWED_ORIGINS=http://localhost:3000
```

---

### 認証エラー

**症状**: 401 Unauthorized

**確認事項**:

1. `CLERK_ISSUER` が正しく設定されているか（JWKS取得に使用）
2. トークンが期限切れでないか
3. Authorization ヘッダーの形式（`Bearer <token>`）
4. Clerk ダッシュボードで正しい Issuer URL を確認

---

### `POST /api/songs` などで外部キー制約違反（500）が発生する

**症状**: 認証は成功する（401 にならない）のに、曲作成時に以下のようなエラーで 500 が返る。

```
PostgresError: insert or update on table "Songs" violates foreign key constraint "Songs_UserId_Users_Id_fk"
detail: Key (UserId)=(user_xxx) is not present in table "Users".
```

**原因**: Clerk の JWT 認証と `Users` テーブルへの同期（Clerk Webhook）が別経路のため、Webhook がまだ届いていない・失敗している状態で書き込み系 API にアクセスすると発生しうる（[Issue #19](https://github.com/yasudaProduct/chord-chart/issues/19)）。

**対策（実装済み）**: `authMiddleware()` が JWT 検証成功時に JIT（Just-in-Time）プロビジョニングとして `Users` テーブルへの存在保証を行うため、通常はこのエラーは発生しない。詳細は [バックエンドアーキテクチャ「ユーザー同期」](../architecture/backend.md#ユーザー同期webhook--jitプロビジョニング) を参照。

**それでも発生する場合**:

1. ローカル DB が起動しているか（`docker compose ps`）
2. `pnpm db:seed` 等で `Users` テーブルだけ削除・リセットしていないか
3. デプロイ直後で新しいコードがまだ反映されていないか

---

## デプロイ

### Cloudflare Pages ビルドエラー

**症状**: ビルド失敗

**確認事項**:

```bash
# ローカルで Pages 向けビルドを確認
cd apps/frontend
npx @cloudflare/next-on-pages
```

**よくある原因**:

- TypeScript 型エラー
- ESLint エラー
- 環境変数の未設定
- Edge Runtime 非対応 API の使用

**解決方法**:

1. ローカルで `npx @cloudflare/next-on-pages` が通るか確認
2. Cloudflare Pages の環境変数を確認
3. `NEXT_PUBLIC_` プレフィックスを確認

---

### Cloudflare Workers デプロイエラー

**症状**: デプロイ失敗

**確認事項**:

```bash
# 設定とバンドルを検証（デプロイはしない）
cd apps/backend
npx wrangler deploy --dry-run
```

**よくある原因**:

- シークレット（`DATABASE_URL` 等）が未登録（`wrangler secret list` で確認）
- `compatibility_flags` に `nodejs_compat` が不足
- TypeScript のコンパイルエラー

---

### デプロイ後に動作しない

**症状**: デプロイ成功だが 500 エラー

**確認事項**:

1. Workers のログを確認
2. シークレット／環境変数が正しく設定されているか
3. データベース接続が成功しているか

**ログの確認**:

```bash
# ライブログ（稼働中 Worker にリクエストが来たときに流れる）
cd apps/backend
npx wrangler tail
npx wrangler tail --status error
```

---

### Cloudflare Workers で不定期に `/api/songs` などが 500 になる

**症状**: Workers のログに以下のようなエラーが混ざる（成功リクエストの直後にも再発しうる）。

```
Unhandled error: Error: Cannot perform I/O on behalf of a different request.
I/O objects ... created in the context of one request handler cannot be accessed from a different request's handler.
(I/O type: Writable)
```

**原因**: Workers 上では、あるリクエストの処理で作られたソケット／ストリームを別リクエストから触れない。`postgres.js` の TCP コネクションをモジュール先頭で共有するとこの制約に抵触する。

**対策**: `DATABASE_DRIVER` でドライバを明示設定する。Cloudflare Workers は `neon-http`、ローカル Node は `postgres-js` を指定する。

詳細セットアップは [ステージング環境](../infrastructure/staging-setup.md) を参照。

---

### Cloudflare Pages デプロイで `Invalid commit message`（code: 8000111）

**症状**: GitHub Actions の `wrangler pages deploy` が次のような API エラーで止まる。

```
Invalid commit message, it must be a valid UTF-8 string. [code: 8000111]
```

**原因**: デプロイに付与するコミットメッセージが、API 入力として無効な UTF-8 として判定されることがある（マージコミットや外部ツール由来の異常バイトなど）。

**対策**: `wrangler pages deploy` に `--commit-hash ${{ github.sha }}` と、`--commit-message` で ASCII のみの固定文字列（例: `deploy-staging-<sha>`）を明示する。

本リポジトリでは staging 用ワークフロー（`.github/workflows/deploy-staging.yml`）で上記を指定している。

---

## パフォーマンス

### API レスポンスが遅い

**確認事項**:

1. N+1 クエリがないか
2. インデックスが適切か
3. 不要なデータを取得していないか

**対策**:

```typescript
// 必要なカラムのみ Select
const result = await db
  .select({
    id: songs.id,
    title: songs.title,
    artist: songs.artist,
  })
  .from(songs)
  .where(eq(songs.visibility, Visibility.Public));
```

---

### フロントエンドが重い

**確認事項**:

1. 大きなバンドルサイズ
2. 不要な再レンダリング
3. 画像の最適化

**対策**:

```bash
# バンドル分析
cd apps/frontend
pnpm build
# .next/analyze を確認
```

---

## よくあるエラーメッセージ

### `Cannot perform I/O on behalf of a different request`

Cloudflare Workers で `DATABASE_DRIVER=postgres-js` だと `postgres.js` の接続再利用により発生することがある。`DATABASE_DRIVER=neon-http` を指定する。詳細は本章の「Cloudflare Workers で不定期に `/api/songs` などが 500 になる」を参照。

### `NEXT_PUBLIC_xxx is not defined`

環境変数が設定されていない。`.env.local` に追加して再起動する。

### `Unable to connect to PostgreSQL`

接続文字列が間違っているか、ネットワーク問題。

1. `DATABASE_URL` を確認
2. ローカルは Docker が起動しているか: `docker compose ps`
3. 本番環境では SSL 接続を有効にする（`?sslmode=require`）

### `JWT token is expired`

トークンが期限切れ。Clerk の `useAuth` フックで再取得する。

### `Module not found`

パッケージがインストールされていない。

```bash
pnpm install
```

---

## デバッグ Tips

### フロントエンド

```typescript
// API レスポンスのログ
const response = await api.get("/songs");
console.log("Response:", response);

// Zustand の状態確認
const state = useEditorStore.getState();
console.log("Editor state:", state);
```

### バックエンド

Hono の logger ミドルウェアが全リクエストをログ出力します。

```bash
# 開発サーバー起動（ログ付き）
cd apps/backend
pnpm dev
```

### ネットワーク

```bash
# API の疎通確認
curl http://localhost:8080/api/health

# SSL 確認
curl -v https://chordbook-api-staging.<account>.workers.dev/api/health
```

---

## サポート

解決しない場合:

1. GitHub Issues で報告
2. エラーログを添付
3. 再現手順を記載

---

## 関連ドキュメント

- [環境構築](../development/getting-started.md)
- [環境変数](./environments.md)
- [フロントエンドデプロイ](./frontend-deploy.md)
- [バックエンドデプロイ](./backend-deploy.md)
