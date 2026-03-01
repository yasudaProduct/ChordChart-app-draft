# バックエンド移行計画: ASP.NET Core → Hono (TypeScript)

## 概要

現在の ASP.NET Core 8 (Clean Architecture) バックエンドを Hono (TypeScript) に移行する。
フロントエンド(Next.js/TypeScript)と言語を統一し、開発効率と保守性を向上させる。

### 移行対象の規模

| 指標 | 現状 |
|------|------|
| エンドポイント数 | 9（Health 1 + Songs 6 + 予備 2） |
| エンティティ数 | 4（User, Song, Bookmark, SongShare） |
| MediatR ハンドラー数 | 6（3 Commands + 3 Queries） |
| C# ソースファイル数 | 29 |
| 総コード行数 | 約850行 |

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
| **パッケージマネージャ** | pnpm | モノレポ（既存のworkspace構成を活用） |

---

## フェーズ構成

### フェーズ1: プロジェクト初期セットアップ

**目標:** Hono プロジェクトの雛形を作成し、開発環境を整える

#### 1.1 プロジェクト構造の作成

```
apps/backend-hono/
├── src/
│   ├── index.ts              # エントリポイント（Hono app起動）
│   ├── app.ts                # Honoアプリ定義・ミドルウェア設定
│   ├── routes/
│   │   ├── songs.ts          # /api/songs ルート
│   │   └── health.ts         # /api/health ルート
│   ├── middleware/
│   │   └── auth.ts           # JWT認証ミドルウェア
│   ├── db/
│   │   ├── index.ts          # Drizzle クライアント初期化
│   │   └── schema.ts         # Drizzle スキーマ定義
│   ├── services/
│   │   └── song.service.ts   # ビジネスロジック
│   ├── types/
│   │   └── index.ts          # 共通型定義
│   └── lib/
│       └── utils.ts          # ユーティリティ
├── drizzle/
│   └── migrations/           # Drizzleマイグレーション（必要に応じて）
├── test/
│   ├── routes/
│   │   └── songs.test.ts     # ルートテスト
│   └── setup.ts              # テストセットアップ
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── vitest.config.ts
├── Dockerfile
└── .env.example
```

#### 1.2 作業内容

- [ ] `apps/backend-hono/` ディレクトリ作成
- [ ] `package.json` 初期化（pnpm workspace に追加）
- [ ] 依存パッケージのインストール
  - `hono`, `@hono/node-server`
  - `drizzle-orm`, `postgres`（node-postgres）
  - `zod`, `@hono/zod-validator`
  - `jose`（JWT検証）
  - `dotenv`
- [ ] 開発依存パッケージのインストール
  - `typescript`, `@types/node`
  - `tsx`（開発時実行）
  - `tsup`（ビルド）
  - `vitest`
  - `drizzle-kit`
- [ ] `tsconfig.json` 設定
- [ ] `pnpm-workspace.yaml` に `apps/backend-hono` を追加
- [ ] 基本的な `src/index.ts` と `src/app.ts` を作成
- [ ] `package.json` の scripts 設定
  ```json
  {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push"
  }
  ```

---

### フェーズ2: データベース層の実装

**目標:** Drizzle ORM でスキーマを定義し、既存のDBに接続する

#### 2.1 スキーマ定義（`src/db/schema.ts`）

既存の PostgreSQL テーブルに合わせて Drizzle スキーマを定義する。

**テーブルマッピング:**

| ASP.NET Core (EF Core) | Drizzle ORM |
|------------------------|-------------|
| `BaseEntity` (Id, CreatedAt, UpdatedAt) | 共通カラム定義 |
| `User` エンティティ | `users` テーブル |
| `Song` エンティティ | `songs` テーブル |
| `Bookmark` エンティティ | `bookmarks` テーブル |
| `SongShare` エンティティ | `songShares` テーブル |
| `Visibility` enum | TypeScript union type |

#### 2.2 作業内容

- [ ] `src/db/schema.ts` — 4テーブルのスキーマ定義
  - `users`: id(uuid), email, displayName, avatarUrl, createdAt, updatedAt
  - `songs`: id(uuid), userId(FK), title, artist, key, bpm, timeSignature, content(jsonb), visibility(int), createdAt, updatedAt
  - `bookmarks`: id(uuid), userId(FK), songId(FK), createdAt, updatedAt
  - `songShares`: id(uuid), songId(FK), shareToken, expiresAt, createdAt, updatedAt
  - インデックス: userId, visibility, (userId+songId) unique, shareToken unique
- [ ] `src/db/index.ts` — Drizzle クライアント初期化（PostgreSQL接続）
- [ ] `drizzle.config.ts` — Drizzle Kit 設定
- [ ] `.env.example` — 環境変数テンプレート
- [ ] DB接続テスト（既存のSupabase DBに接続確認）

#### 2.3 注意点

- **既存DBをそのまま使う**。新しいマイグレーションは実行しない（EF Coreで作成済みのテーブルをそのまま利用）
- Drizzle の `drizzle-kit pull` で既存スキーマからスキーマファイルを生成することも検討
- `content` カラムは `jsonb` 型。Drizzle では `jsonb()` を使用

---

### フェーズ3: 認証ミドルウェアの実装

**目標:** Supabase JWT トークンの検証をHonoミドルウェアとして実装する

#### 3.1 現行の認証フロー（移植対象）

```
リクエスト
  → Authorization: Bearer {supabase_jwt}
  → JWT検証（issuer, audience, 有効期限, 署名）
  → Claims抽出（sub → userId, email）
  → コンテキストに格納
```

#### 3.2 作業内容

- [ ] `src/middleware/auth.ts` — JWT認証ミドルウェア
  - `jose` ライブラリでSupabase JWTを検証
  - JWKS エンドポイント (`{supabaseUrl}/auth/v1/.well-known/jwks.json`) から公開鍵取得
  - 検証パラメータ:
    - issuer: `{supabaseUrl}/auth/v1`
    - audience: `authenticated`
  - 検証成功時: `c.set('userId', sub)`, `c.set('email', email)` でコンテキストに格納
  - 検証失敗時: 401 Unauthorized
- [ ] オプショナル認証ミドルウェア（`AllowAnonymous` 相当）
  - トークンがあれば検証して userId をセット
  - トークンがなくても通過（userId は undefined）
- [ ] Hono の Variables 型定義（型安全なコンテキスト）

#### 3.3 ASP.NET Core → Hono 対応表

| ASP.NET Core | Hono |
|-------------|------|
| `[Authorize]` | `authMiddleware()` を route に適用 |
| `[AllowAnonymous]` | `optionalAuthMiddleware()` を route に適用 |
| `ICurrentUserService.UserId` | `c.get('userId')` |
| `ICurrentUserService.Email` | `c.get('email')` |
| `ICurrentUserService.IsAuthenticated` | `c.get('userId') !== undefined` |

---

### フェーズ4: APIエンドポイントの実装

**目標:** 既存の全エンドポイントをHonoで再実装する

#### 4.1 エンドポイント一覧と実装方針

| # | メソッド | パス | 認証 | 元Handler | 移行先 |
|---|---------|------|------|-----------|--------|
| 1 | GET | `/api/health` | 不要 | HealthController | `routes/health.ts` |
| 2 | GET | `/api/songs` | オプション | GetSongsQueryHandler | `routes/songs.ts` |
| 3 | GET | `/api/songs/search` | オプション | SearchSongsQueryHandler | `routes/songs.ts` |
| 4 | GET | `/api/songs/:id` | オプション | GetSongByIdQueryHandler | `routes/songs.ts` |
| 5 | POST | `/api/songs` | 必須 | CreateSongCommandHandler | `routes/songs.ts` |
| 6 | PUT | `/api/songs/:id` | 必須 | UpdateSongCommandHandler | `routes/songs.ts` |
| 7 | DELETE | `/api/songs/:id` | 必須 | DeleteSongCommandHandler | `routes/songs.ts` |

#### 4.2 作業内容

- [ ] `src/routes/health.ts` — ヘルスチェック
- [ ] `src/routes/songs.ts` — Song CRUD + 検索
- [ ] `src/services/song.service.ts` — ビジネスロジック（DB操作）
  - `listSongs(userId?: string)` — 一覧取得
  - `searchSongs(query: string)` — 検索（Public曲のみ）
  - `getSongById(id: string, userId?: string)` — 詳細取得（権限チェック付き）
  - `createSong(userId: string, data: CreateSongInput)` — 作成
  - `updateSong(id: string, userId: string, data: UpdateSongInput)` — 更新（所有者チェック）
  - `deleteSong(id: string, userId: string)` — 削除（所有者チェック）
- [ ] Zodスキーマ定義（リクエストバリデーション）
  - `CreateSongSchema` — title(必須), artist, key, bpm, timeSignature
  - `UpdateSongSchema` — title(必須), artist, key, bpm, timeSignature, content(JSON)

#### 4.3 レスポンス形式の維持

フロントエンドの `songApi.ts` が期待するレスポンス形式を維持する。

```typescript
// SongDto（詳細）
{
  id: string,           // UUID
  title: string,
  artist: string | null,
  key: string | null,
  bpm: number | null,
  timeSignature: string,
  content: object,      // JSONパース済み（※現行はJsonElement）
  visibility: number,   // 0-3
  createdAt: string,    // ISO8601
  updatedAt: string     // ISO8601
}

// SongListItemDto（一覧）
{
  id: string,
  title: string,
  artist: string | null,
  key: string | null,
  updatedAt: string
}
```

#### 4.4 ビジネスロジックの移植ポイント

**可視性制御（GetSongs）:**
```
認証ユーザー → 自分の曲 OR Public曲
匿名ユーザー → Public曲のみ
```

**可視性制御（GetSongById）:**
```
認証ユーザー → 自分の曲 OR Public OR UrlOnly
匿名ユーザー → Publicのみ
```

**所有者チェック（Update/Delete）:**
```
song.userId === requestUserId でなければ 404 を返す（権限情報を隠蔽）
```

---

### フェーズ5: CORS・エラーハンドリング・共通設定

**目標:** 本番環境で必要な共通設定を実装する

#### 5.1 作業内容

- [ ] CORS設定
  - Honoの `cors()` ミドルウェア使用
  - 開発: `http://localhost:3000`
  - 本番: 環境変数 `ALLOWED_ORIGINS` から取得
  - credentials: true
- [ ] エラーハンドリング
  - グローバルエラーハンドラ（`app.onError`）
  - HTTPステータスコードを現行と一致させる
    - 200, 201, 204, 400, 401, 404, 500
  - エラーレスポンス形式の統一
- [ ] ロギング
  - Hono の `logger()` ミドルウェア
- [ ] 環境変数管理
  - `DATABASE_URL` — PostgreSQL接続文字列
  - `SUPABASE_URL` — Supabase URL
  - `SUPABASE_JWT_SECRET` — JWT秘密鍵（オプション）
  - `ALLOWED_ORIGINS` — CORS許可オリジン
  - `PORT` — サーバーポート（デフォルト: 8080）

---

### フェーズ6: テスト

**目標:** 主要な機能のテストを実装する

#### 6.1 作業内容

- [ ] テストセットアップ（`vitest.config.ts`, `test/setup.ts`）
- [ ] ルートテスト（`test/routes/songs.test.ts`）
  - Honoの `app.request()` を使用した統合テスト
  - 各エンドポイントの正常系・異常系テスト
  - 認証あり/なしのテスト
  - 権限チェックのテスト（他ユーザーの曲へのアクセス）
- [ ] サービス層テスト（必要に応じて）

---

### フェーズ7: Dockerとデプロイ設定

**目標:** Railway へのデプロイ準備

#### 7.1 作業内容

- [ ] `Dockerfile` 作成
  ```dockerfile
  FROM node:20-slim AS builder
  # pnpmインストール、依存関係インストール、ビルド

  FROM node:20-slim
  # 本番用の最小イメージ
  EXPOSE 8080
  CMD ["node", "dist/index.js"]
  ```
- [ ] `.dockerignore` 作成
- [ ] Railway設定の調整（環境変数のマッピング）
- [ ] ヘルスチェックエンドポイントの動作確認

---

### フェーズ8: 結合テストと切り替え

**目標:** フロントエンドと結合して動作確認し、本番切り替えを行う

#### 8.1 ローカル結合テスト

- [ ] `apps/backend-hono` を `pnpm dev` で起動
- [ ] フロントエンドの `NEXT_PUBLIC_API_URL` を Hono バックエンドに向ける
- [ ] 全画面の操作テスト
  - ログイン/ログアウト
  - 曲一覧表示
  - 曲作成・編集・削除
  - 曲検索
  - 公開/非公開の切り替え
  - 未ログイン時のアクセス制限

#### 8.2 本番切り替え

- [ ] Railway に Hono バックエンドをデプロイ
- [ ] 環境変数を設定
- [ ] フロントエンド（Vercel）の `NEXT_PUBLIC_API_URL` を新バックエンドに変更
- [ ] 動作確認
- [ ] 旧 .NET バックエンドの停止

#### 8.3 後片付け

- [ ] `CLAUDE.md` のバックエンド関連セクションを更新
- [ ] `docs/` 配下のバックエンド関連ドキュメントを更新
- [ ] 旧 `apps/backend/` の扱いを決定（アーカイブ or 削除）

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| レスポンス形式の差異 | フロントエンドが壊れる | フロントの `songApi.ts` のマッピング処理を基準に形式を合わせる |
| JWT検証の差異 | 認証が通らない | ASP.NET Coreと同じ検証パラメータ（issuer, audience）を使用。joseライブラリで実装 |
| EF Core → Drizzle のSQL差異 | クエリ結果が変わる | 既存のクエリロジックを忠実に再実装。LIKE検索の挙動を確認 |
| 既存DBとの互換性 | テーブル名・カラム名の不一致 | Drizzleスキーマで明示的にテーブル名・カラム名を指定 |
| ダウンタイム | サービス停止 | 新旧バックエンドを並行稼働させ、フロントの向き先を切り替える |

---

## フロントエンド側の変更

基本的にフロントエンド側の変更は **不要** を目指す。

理由:
- APIのエンドポイントパス、リクエスト/レスポンス形式を完全に一致させる
- 認証フロー（Supabase Auth → JWT → Backend）は変わらない
- `NEXT_PUBLIC_API_URL` の向き先変更のみ

唯一の確認事項:
- レスポンスのJSON形式（特に `content` フィールドの返し方）が `.NET` の `JsonElement` と同一かを検証
