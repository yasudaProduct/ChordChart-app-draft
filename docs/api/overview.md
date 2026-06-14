# API 概要

ChordBook REST API の概要と認証方式です。

## 基本情報

| 項目       | 値       |
| ---------- | -------- |
| プロトコル | HTTPS    |
| 形式       | REST API |
| データ形式 | JSON     |
| 文字コード | UTF-8    |

### ベース URL

| 環境         | URL                                                       |
| ------------ | --------------------------------------------------------- |
| 開発         | http://localhost:8080/api                                 |
| ステージング | https://chordbook-api-staging.\<account\>.workers.dev/api |

---

## 認証

Clerk が発行する JWT を使用します。

### 認証ヘッダー

```
Authorization: Bearer <access_token>
```

### 認証レベル

| レベル                                | 説明                     | 未認証時の動作     |
| ------------------------------------- | ------------------------ | ------------------ |
| 必須 (`authMiddleware`)               | 認証が必要               | 401 Unauthorized   |
| オプション (`optionalAuthMiddleware`) | 認証なしでもアクセス可能 | 公開データのみ返却 |

---

## リクエスト

### ヘッダー

| ヘッダー      | 必須                 | 説明               |
| ------------- | -------------------- | ------------------ |
| Content-Type  | POST/PUT             | `application/json` |
| Authorization | エンドポイントによる | `Bearer <token>`   |

### リクエストボディ

```json
{
  "title": "曲名",
  "artist": "アーティスト",
  "key": "C",
  "bpm": 120
}
```

バリデーションには Zod を使用しています。

### Content（コード譜データ）

`Song.content` は JSON 文字列として保存されるコード譜データです。現行形式は `{ "sections": [...] }` です。

例:

```json
{
  "sections": [
    {
      "id": "section-1",
      "name": "Aメロ",
      "type": "lyrics-chord",
      "content": "{\"lines\":[{\"id\":\"line-1\",\"lyrics\":\"きょうも いちにち\",\"chords\":[{\"id\":\"chord-1\",\"chord\":\"C\",\"offset\":0.05}]}]}"
    }
  ]
}
```

- 各セクションの `content` は `{ "lines": [...] }` 形式の JSON 文字列
- セクション `type` は `lyrics-chord` または `chord-only`
- コード位置は `offset`（0〜1 の相対位置）で表現
- フロントエンドは旧形式（トップレベル配列など）も読み取り時に変換

詳細は `docs/database/tables.md` を参照。

---

## レスポンス

### 成功レスポンス

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "サンプル曲",
  "artist": "アーティスト",
  "key": "C",
  "bpm": 120,
  "timeSignature": "4/4",
  "content": { "sections": [] },
  "visibility": "private",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 一覧レスポンス

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "サンプル曲",
    "artist": "アーティスト",
    "key": "C",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### エラーレスポンス

#### バリデーションエラー（400）

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["title"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

#### 認証エラー（401）

```json
{
  "error": "Unauthorized"
}
```

#### Not Found（404）

```json
{
  "error": "Song not found"
}
```

---

## HTTP ステータスコード

### 成功

| コード | 説明       | 用途                      |
| ------ | ---------- | ------------------------- |
| 200    | OK         | GET/PUT 成功              |
| 201    | Created    | POST 成功（リソース作成） |
| 204    | No Content | DELETE 成功               |

### クライアントエラー

| コード | 説明         | 原因                 |
| ------ | ------------ | -------------------- |
| 400    | Bad Request  | バリデーションエラー |
| 401    | Unauthorized | 認証エラー           |
| 404    | Not Found    | リソースが存在しない |

### サーバーエラー

| コード | 説明                  | 原因               |
| ------ | --------------------- | ------------------ |
| 500    | Internal Server Error | サーバー内部エラー |

---

## CORS

`ALLOWED_ORIGINS`（カンマ区切り）で許可オリジンを指定します。Cloudflare Workers では `wrangler.toml` の `[vars]` またはダッシュボードの Variables が Hono の `c.env` に載り、ローカル Node サーバーでは `process.env` と `.env` を参照します。

```typescript
// app.ts（概要）
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const raw =
        c.env?.ALLOWED_ORIGINS?.trim() ||
        process.env.ALLOWED_ORIGINS?.trim() ||
        "http://localhost:3000";
      const allowed = raw
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
```

### 許可オリジン

| 環境         | オリジン                                     |
| ------------ | -------------------------------------------- |
| 開発         | http://localhost:3000                        |
| ステージング | https://chordbook-frontend-staging.pages.dev |

---

## レート制限

（未実装）

---

## バージョニング

現在は v1 のみ。将来的にバージョニングを導入する場合:

```
/api/v1/songs
/api/v2/songs
```

---

## API テスト

VS Code の REST Client 拡張機能を使用して API をテストできます。

```
apps/backend/.http/
├── auth.http     # 認証テスト
└── songs.http    # Song CRUD
```

---

## 関連ドキュメント

- [エンドポイント一覧](./endpoints.md) - 各APIの詳細
- [環境変数](../deployment/environments.md) - API URL設定
