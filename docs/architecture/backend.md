# バックエンドアーキテクチャ

Hono (TypeScript) を使用したバックエンドの設計を説明します。

## アーキテクチャ概要

シンプルなレイヤードアーキテクチャを採用しています。

```
┌─────────────────────────────────────────────────────────────────┐
│                         外部                                    │
│                    (HTTP, DB, etc.)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Routes 層                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  routes/songs.ts  │  routes/health.ts  │  middleware/    │   │
│  │  (Zodバリデーション)                     │  (JWT認証)      │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     Service 層                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  services/song.service.ts                                │   │
│  │  (ビジネスロジック・クエリ構築)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       DB 層                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  db/schema.ts (Drizzle スキーマ)  │  db/index.ts (接続)  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## ディレクトリ構成

```
apps/backend/src/
├── index.ts              # エントリポイント（サーバー起動）
├── app.ts                # Hono アプリ定義（CORS, logger, エラーハンドラ）
├── routes/
│   ├── health.ts         # GET /api/health
│   ├── songs.ts          # Song CRUD + 検索（Zodバリデーション）
│   └── webhooks.ts       # Clerk Webhook（ユーザー同期）
├── middleware/
│   └── auth.ts           # Clerk JWT 認証（jose）
├── services/
│   └── song.service.ts   # ビジネスロジック
├── db/
│   ├── schema.ts         # Drizzle ORM スキーマ（4テーブル）
│   └── index.ts          # DB クライアント初期化
└── types/
    └── index.ts          # Visibility 定数・型定義
```

## 各層の責務

### Routes 層

HTTP リクエストの受付、バリデーション、レスポンス返却を担当。

```typescript
// routes/songs.ts
const createSongSchema = z.object({
  title: z.string().min(1),
  artist: z.string().nullable().optional(),
  key: z.string().nullable().optional(),
  bpm: z.number().int().nullable().optional(),
  timeSignature: z.string().optional().default("4/4"),
});

songs.post("/", authMiddleware(), zValidator("json", createSongSchema, ...), async (c) => {
  const userId = c.get("userId")!;
  const data = c.req.valid("json");
  const song = await createSong(userId, data);
  return c.json(song, 201);
});
```

### Middleware 層

認証処理を担当。Clerk の JWKS を使用して JWT を検証。

```typescript
// middleware/auth.ts

// 認証必須
export const authMiddleware = () => async (c, next) => {
  const token = extractToken(c.req.header("Authorization"));
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: process.env.CLERK_ISSUER,
  });
  c.set("userId", payload.sub);
  await next();
};

// 認証オプション（匿名アクセス許可）
export const optionalAuthMiddleware = () => async (c, next) => {
  // トークンがあれば検証、なければスルー
};
```

### Service 層

ビジネスロジックとデータアクセスを担当。

```typescript
// services/song.service.ts

export async function listSongs(userId?: string) {
  if (userId) {
    return db.select({ ... }).from(songs).where(eq(songs.userId, userId));
  }
  return db.select({ ... }).from(songs).where(eq(songs.visibility, Visibility.Public));
}

export async function createSong(userId: string, data: CreateSongInput) {
  const [song] = await db.insert(songs).values({
    userId,
    title: data.title,
    artist: data.artist,
    // ...
  }).returning();
  return song;
}
```

### DB 層

Drizzle ORM によるスキーマ定義とデータベース接続。

```typescript
// db/schema.ts
export const songs = pgTable("Songs", {
  id: uuid("Id").primaryKey().defaultRandom(),
  userId: text("UserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("Title", { length: 200 }).notNull(),
  artist: varchar("Artist", { length: 200 }),
  key: varchar("Key", { length: 10 }),
  bpm: integer("Bpm"),
  timeSignature: varchar("TimeSignature", { length: 10 }).default("4/4"),
  content: text("Content").default("[]"),
  visibility: integer("Visibility").default(0),
  createdAt: timestamp("CreatedAt").defaultNow(),
  updatedAt: timestamp("UpdatedAt").defaultNow(),
});
```

## リクエスト処理フロー

```
HTTP Request
    │
    ▼
┌─────────────────┐
│   Middleware     │  CORS, Logger
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Auth          │  JWT 検証（必須 or オプション）
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Zod Validator │  リクエストボディのバリデーション
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Route Handler │  Service 呼び出し・レスポンス構築
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service       │  ビジネスロジック
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Drizzle ORM   │  データベース操作
└────────┬────────┘
         │
         ▼
HTTP Response
```

## 認証フロー

Clerk が発行した JWT を JWKS（JSON Web Key Set）で検証します。

```
1. クライアント → Clerk でログイン → access_token 取得
2. クライアント → Authorization: Bearer {access_token} でAPIリクエスト
3. バックエンド → JWKS エンドポイントから公開鍵を取得（キャッシュ）
4. バックエンド → jose.jwtVerify() で検証
   - issuer: {CLERK_ISSUER}
5. 検証成功 → payload.sub を userId として利用
```

### 2種類のミドルウェア

| ミドルウェア | 用途 | 使用エンドポイント |
|---|---|---|
| `authMiddleware()` | 認証必須（401を返す） | POST, PUT, DELETE |
| `optionalAuthMiddleware()` | 認証オプション（匿名許可） | GET（一覧・詳細・検索） |

## 主要な設計判断

### Hono を選択した理由

- TypeScript ネイティブで型安全
- 軽量・高速（Web Standard API ベース）
- ミドルウェア / バリデーション の組み込みサポート
- フロントエンドと同じ TypeScript で統一

### Drizzle ORM を選択した理由

- 型安全なクエリビルダー
- スキーマファーストのアプローチ
- 軽量で高速
- SQL に近い直感的な API

## 関連ドキュメント

- [システム概要](./overview.md) - 全体アーキテクチャ
- [API仕様](../api/endpoints.md) - エンドポイント詳細
- [データベース設計](../database/er-diagram.md) - エンティティとテーブル
