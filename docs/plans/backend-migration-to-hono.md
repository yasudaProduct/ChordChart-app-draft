# バックエンド移行計画: ASP.NET Core → Hono (TypeScript)

## 概要

現在の ASP.NET Core 8 (Clean Architecture) バックエンドを Hono (TypeScript) に移行する。
フロントエンド(Next.js/TypeScript)と言語を統一し、開発効率と保守性を向上させる。

### 移行対象の規模

| 指標 | 移行前 (ASP.NET Core) | 移行後 (Hono) |
|------|------|------|
| エンドポイント数 | 7（Health 1 + Songs 6） | 7（同一） |
| エンティティ数 | 4（User, Song, Bookmark, SongShare） | 4（同一、Drizzle スキーマ） |
| MediatR ハンドラー数 | 6（3 Commands + 3 Queries） | — (Service層に統合) |
| ソースファイル数 | 29 (C#) | 8 (TypeScript) |
| テストファイル数 | 0 | 3（setup + 2テストファイル, 15テスト） |
| 総コード行数 | 約850行 | 約350行 |

---

## 技術選定

| カテゴリ | 選定技術 | 選定理由 |
|----------|----------|----------|
| **ランタイム** | Node.js | フロントエンドと統一、Railwayサポート |
| **フレームワーク** | Hono | 軽量・高速、型安全なルーティング、ミドルウェア充実 |
| **ORM** | Drizzle ORM | 型安全、SQLライク、軽量、PostgreSQL対応 |
| **バリデーション** | Zod | TypeScript ファーストなスキーマ定義、Hono統合あり |
| **JWT検証** | jose | 標準的なJWT/JWK処理ライブラリ |
| **テスト** | Vitest | 高速、TypeScriptネイティブ、Hono公式推奨 |
| **ビルド** | tsup | シンプルなTypeScriptバンドラー |
| **パッケージマネージャ** | pnpm | フロントエンドと統一 |

---

## 実装済みファイル構造

```
apps/backend-hono/
├── src/
│   ├── index.ts              # エントリポイント（@hono/node-server）
│   ├── app.ts                # Honoアプリ定義（CORS, logger, エラーハンドラ）
│   ├── routes/
│   │   ├── health.ts         # GET /api/health
│   │   └── songs.ts          # Song CRUD + 検索（Zodバリデーション）
│   ├── middleware/
│   │   └── auth.ts           # JWT認証ミドルウェア（jose + JWKS）
│   ├── db/
│   │   ├── schema.ts         # Drizzle ORMスキーマ（4テーブル + リレーション）
│   │   └── index.ts          # DBクライアント初期化（postgres.js）
│   ├── services/
│   │   └── song.service.ts   # ビジネスロジック（6関数）
│   └── types/
│       └── index.ts          # Visibility定数・型定義
├── test/
│   ├── setup.ts              # テストセットアップ（環境変数モック）
│   └── routes/
│       ├── health.test.ts    # ヘルスチェックテスト（1テスト）
│       └── songs.test.ts     # Songs統合テスト（14テスト）
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── drizzle.config.ts
├── Dockerfile                # マルチステージビルド（node:20-slim）
├── .dockerignore
└── .env.example
```

---

## フェーズ実施状況

### フェーズ1: プロジェクト初期セットアップ ✅ 完了

- [x] `apps/backend-hono/` ディレクトリ作成
- [x] `package.json` 初期化
- [x] 依存パッケージのインストール
  - `hono`, `@hono/node-server`, `drizzle-orm`, `postgres`, `zod`, `@hono/zod-validator`, `jose`, `dotenv`
- [x] 開発依存パッケージのインストール
  - `typescript`, `@types/node`, `tsx`, `tsup`, `vitest`, `drizzle-kit`
- [x] `tsconfig.json` 設定（ES2022, ESNext, bundler moduleResolution）
- [x] `src/index.ts` と `src/app.ts` を作成
- [x] `package.json` の scripts 設定

---

### フェーズ2: データベース層の実装 ✅ 完了

- [x] `src/db/schema.ts` — 4テーブルのスキーマ定義（PascalCaseカラム名で既存DBと完全一致）
- [x] `src/db/index.ts` — Drizzle クライアント初期化（postgres.js ドライバ）
- [x] `drizzle.config.ts` — Drizzle Kit 設定
- [x] `.env.example` — 環境変数テンプレート
- [x] DB接続テスト（ローカルSupabase DB で確認済み）

#### 実装時の注意点・知見

- **テーブル名・カラム名:** EF Core が PascalCase で作成したテーブル/カラムに合わせ、Drizzle スキーマで明示的に `pgTable('Songs', { id: uuid('Id'), ... })` のように指定
- **UUID生成:** EF Core はアプリ側で UUID を生成するためDB側にデフォルト値がない。Drizzle では `$defaultFn(() => crypto.randomUUID())` を使用（`defaultRandom()` は DB側 `gen_random_uuid()` に依存するため不可）
- **content カラム:** `jsonb` ではなく `text` 型で保存されている（EF Core の実装に合わせた）
- **リレーション定義:** Drizzle の `relations()` で全FK関係を定義済み

---

### フェーズ3: 認証ミドルウェアの実装 ✅ 完了

- [x] `src/middleware/auth.ts` — JWT認証ミドルウェア
  - `jose` の `createRemoteJWKSet` + `jwtVerify` でSupabase JWTを検証
  - JWKS は遅延初期化 + モジュールスコープでキャッシュ
  - 検証パラメータ: issuer=`${SUPABASE_URL}/auth/v1`, audience=`authenticated`
- [x] `authMiddleware()` — 認証必須（トークンなし/不正→ 401）
- [x] `optionalAuthMiddleware()` — 認証オプション（トークンなし/不正でもスルー）
- [x] `AuthVariables` 型定義（`userId: string | undefined`, `email: string | undefined`）

#### ASP.NET Core → Hono 対応表

| ASP.NET Core | Hono |
|-------------|------|
| `[Authorize]` | `authMiddleware()` を route に適用 |
| `[AllowAnonymous]` | `optionalAuthMiddleware()` を route に適用 |
| `ICurrentUserService.UserId` | `c.get('userId')` |
| `ICurrentUserService.Email` | `c.get('email')` |
| `ICurrentUserService.IsAuthenticated` | `c.get('userId') !== undefined` |

---

### フェーズ4: APIエンドポイントの実装 ✅ 完了

#### エンドポイント一覧

| # | メソッド | パス | 認証 | 実装ファイル |
|---|---------|------|------|-------------|
| 1 | GET | `/api/health` | 不要 | `routes/health.ts` |
| 2 | GET | `/api/songs` | オプション | `routes/songs.ts` |
| 3 | GET | `/api/songs/search` | オプション | `routes/songs.ts` |
| 4 | GET | `/api/songs/:id` | オプション | `routes/songs.ts` |
| 5 | POST | `/api/songs` | 必須 | `routes/songs.ts` |
| 6 | PUT | `/api/songs/:id` | 必須 | `routes/songs.ts` |
| 7 | DELETE | `/api/songs/:id` | 必須 | `routes/songs.ts` |

- [x] `src/routes/health.ts` — ヘルスチェック
- [x] `src/routes/songs.ts` — Song CRUD + 検索 + Zodバリデーション
- [x] `src/services/song.service.ts` — ビジネスロジック（6関数）
- [x] Zodスキーマ定義（`createSongSchema`, `updateSongSchema`）
- [x] バリデーションエラー時は 400 Bad Request（zValidator hook）

#### ビジネスロジック（可視性制御・所有者チェック）

**可視性制御（listSongs）:**
```
認証ユーザー → 自分の曲のみ
匿名ユーザー → Public曲のみ
```

**可視性制御（getSongById）:**
```
認証ユーザー → 自分の曲 OR Public OR UrlOnly
匿名ユーザー → Publicのみ
```

**検索（searchSongs）:**
```
全ユーザー共通 → Public曲のみ対象（title, artist, key で ilike 検索）
```

**所有者チェック（updateSong / deleteSong）:**
```
song.userId === requestUserId でなければ null/false（→ 404 を返す、権限情報を隠蔽）
```

---

### フェーズ5: CORS・エラーハンドリング・共通設定 ✅ 完了

- [x] CORS設定（`hono/cors`、`ALLOWED_ORIGINS` 環境変数対応、credentials: true）
- [x] グローバルエラーハンドラ（`app.onError` → 500）
- [x] 404ハンドラ（`app.notFound`）
- [x] ロギング（`hono/logger`）
- [x] 環境変数管理
  - `DATABASE_URL` — PostgreSQL接続文字列
  - `SUPABASE_URL` — Supabase URL
  - `ALLOWED_ORIGINS` — CORS許可オリジン（カンマ区切り）
  - `PORT` — サーバーポート（デフォルト: 8080）

---

### フェーズ6: テスト ✅ 完了

- [x] `vitest.config.ts` + `test/setup.ts` — テストセットアップ
- [x] `test/routes/health.test.ts` — ヘルスチェック（1テスト）
- [x] `test/routes/songs.test.ts` — Songs統合テスト（14テスト）
  - Honoの `app.request()` を使用
  - `songService`, `auth middleware`, `db` をモックして独立テスト
  - 認証あり/なし、所有者/非所有者、バリデーションエラー をカバー

**テスト結果:** 15/15 合格（約500ms）

---

### フェーズ7: Dockerとデプロイ設定 ✅ 完了

- [x] `Dockerfile` — マルチステージビルド（node:20-slim, pnpm）
- [x] `.dockerignore`

---

### フェーズ8: 結合テストと切り替え 🔄 進行中

#### 8.1 ローカル結合テスト ✅ 完了

ローカルSupabase（`127.0.0.1:54321` / `127.0.0.1:54322`）に接続して全エンドポイントの動作確認済み。

| テスト項目 | 結果 |
|-----------|------|
| `GET /api/health` | ✅ 200 |
| `POST /api/songs`（認証付き） | ✅ 201 — 曲作成成功 |
| `GET /api/songs`（認証付き） | ✅ 200 — 自分の曲一覧 |
| `GET /api/songs/:id` | ✅ 200 — 詳細取得（content JSONパース正常） |
| `PUT /api/songs/:id` | ✅ 200 — 更新成功（updatedAt更新確認） |
| `DELETE /api/songs/:id` | ✅ 204 — 削除成功 |
| `POST /api/songs`（認証なし） | ✅ 401 Unauthorized |
| `GET /api/songs/search` | ✅ 200 — Private曲は対象外（正しい動作） |
| `GET /api/songs/:id`（存在しない） | ✅ 404 |

---

## リスクと対策（実績）

| リスク | 対策 | 結果 |
|--------|------|------|
| レスポンス形式の差異 | `songApi.ts` のマッピング処理を基準に形式を合わせる | ✅ 問題なし。content の JSONパースも正常動作 |
| JWT検証の差異 | ASP.NET Coreと同じ検証パラメータを使用 | ✅ jose + JWKS で正常に検証 |
| EF Core → Drizzle のSQL差異 | 既存のクエリロジックを忠実に再実装 | ✅ ilike検索含め正常動作 |
| 既存DBとの互換性 | Drizzleスキーマで明示的にテーブル名・カラム名を指定 | ✅ PascalCase指定で完全一致。**UUID生成は `$defaultFn` に変更が必要だった** |
| ダウンタイム | 新旧バックエンドを並行稼働させる | ⬜ 本番切り替え時に実施予定 |

---

## フロントエンド側の変更

フロントエンド側の変更は **不要** であることを確認済み。

- APIのエンドポイントパス、リクエスト/レスポンス形式は完全に一致
- 認証フロー（Supabase Auth → JWT → Backend）は変わらない
- `NEXT_PUBLIC_API_URL` の向き先変更のみ
- `content` フィールドは JSON.parse 済みオブジェクトとして返却（.NET の `JsonElement` と互換）
