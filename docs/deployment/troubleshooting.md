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

## デプロイ

### Vercel ビルドエラー

**症状**: ビルド失敗

**確認事項**:

```bash
# ローカルでビルド確認
cd apps/frontend
pnpm build
```

**よくある原因**:

- TypeScript 型エラー
- ESLint エラー
- 環境変数の未設定

**解決方法**:

1. ローカルで `pnpm build` が通るか確認
2. Vercel の環境変数を確認
3. `NEXT_PUBLIC_` プレフィックスを確認

---

### Railway ビルドエラー

**症状**: ビルド失敗

**確認事項**:

```bash
# ローカルでビルド確認
cd apps/backend
pnpm build
pnpm start
```

**よくある原因**:

- Root Directory の設定が `apps/backend` になっていない
- 環境変数が未設定
- TypeScript のコンパイルエラー

---

### デプロイ後に動作しない

**症状**: デプロイ成功だが 500 エラー

**確認事項**:

1. Railway のログを確認
2. 環境変数が正しく設定されているか
3. データベース接続が成功しているか

**ログの確認**:

```bash
# Railway CLI
railway logs
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

**対策**: `DATABASE_DRIVER` でドライバを明示設定する。Cloudflare Workers は `neon-http`、Railway／ローカル Node は `postgres-js` を指定する。

詳細セットアップは [ステージング環境](../infrastructure/staging-setup.md) を参照。

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
curl -v https://api.chordbook.railway.app/api/health
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
