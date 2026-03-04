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
cd apps/backend-hono
rm -rf node_modules
pnpm install
```

**よくある原因**:
- `.env` ファイルが存在しない（`.env.example` からコピー）
- `DATABASE_URL` が未設定または不正
- `SUPABASE_URL` が未設定
- ローカル Supabase が起動していない

---

### データベース接続エラー

**症状**: サーバー起動時にDB接続エラー

**確認事項**:
1. ローカル Supabase が起動しているか: `supabase status`
2. `DATABASE_URL` の値が正しいか
3. ローカルの場合ポートが `54322` になっているか

**接続文字列の例（ローカル）**:
```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**接続文字列の例（本番）**:
```
postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres?sslmode=require
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
1. Supabase の設定が正しいか
2. トークンが期限切れでないか
3. Authorization ヘッダーの形式（`Bearer <token>`）
4. `SUPABASE_URL` が正しく設定されているか（JWKS取得に使用）

**デバッグ**:
```typescript
// トークンの確認
const { data: { session } } = await supabase.auth.getSession()
console.log('Token:', session?.access_token)
```

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
cd apps/backend-hono
pnpm build
pnpm start
```

**よくある原因**:
- Root Directory の設定が `apps/backend-hono` になっていない
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

### `NEXT_PUBLIC_xxx is not defined`

環境変数が設定されていない。

```bash
# .env.local に追加
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

### `Unable to connect to PostgreSQL`

接続文字列が間違っているか、ネットワーク問題。

1. `DATABASE_URL` を確認
2. ローカル Supabase が起動しているか: `supabase status`
3. 本番環境では SSL 接続を有効にする

### `JWT token is expired`

トークンが期限切れ。

```typescript
// セッションを更新
await supabase.auth.refreshSession()
```

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
const response = await api.get('/songs')
console.log('Response:', response)

// Zustand の状態確認
const state = useEditorStore.getState()
console.log('Editor state:', state)
```

### バックエンド

Hono の logger ミドルウェアが全リクエストをログ出力します。

```bash
# 開発サーバー起動（ログ付き）
cd apps/backend-hono
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
