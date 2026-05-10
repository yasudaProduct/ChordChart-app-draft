# コーディング規約

ChordBook プロジェクトのコーディングスタイルと命名規則です。

## 共通ルール

### 言語設定

- コードコメント: 日本語 OK
- 変数名・関数名: 英語
- コミットメッセージ: 日本語 OK

### インデント

| 言語 | インデント |
|------|-----------|
| TypeScript/JavaScript | スペース 2 |
| JSON | スペース 2 |
| YAML | スペース 2 |

---

## フロントエンド（TypeScript/React）

### ファイル命名

| 種類 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `SongList.tsx` |
| フック | camelCase（use prefix） | `useSongEditor.ts` |
| ユーティリティ | camelCase | `formatDate.ts` |
| 型定義 | camelCase | `song.ts` |
| ストア | camelCase（Store suffix） | `editorStore.ts` |

### 変数・関数命名

```typescript
// 変数: camelCase
const songTitle = 'Sample Song'
const isLoading = true

// 定数: UPPER_SNAKE_CASE
const MAX_TITLE_LENGTH = 200
const API_BASE_URL = 'http://localhost:8080'

// 関数: camelCase（動詞で始める）
function getSongById(id: string) { }
function handleSubmit() { }
function formatChordName(chord: string) { }

// 型・インターフェース: PascalCase
interface Song { }
type SectionType = 'lyrics-chord' | 'bar'
```

### React コンポーネント

```tsx
// 関数コンポーネント（アロー関数推奨）
export const SongCard = ({ song, onSelect }: SongCardProps) => {
  return (
    <div className="p-4 border rounded">
      <h3>{song.title}</h3>
    </div>
  )
}

// Props 型は別定義
interface SongCardProps {
  song: Song
  onSelect: (id: string) => void
}
```

### インポート順序

```typescript
// 1. React 関連
import { useState, useEffect } from 'react'

// 2. 外部ライブラリ
import { create } from 'zustand'

// 3. 内部モジュール（パスエイリアス）
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

// 4. 型定義
import type { Song } from '@/types/song'

// 5. 相対パス
import { formatDate } from './utils'
```

### ESLint / Prettier

共有設定パッケージ（`packages/` 配下）を各アプリが参照しています。

| パッケージ | 用途 |
|-----------|------|
| `@chordbook/eslint-config` | 共有 ESLint ルール（TypeScript + Node.js） |
| `@chordbook/eslint-config/next` | フロントエンド向け（Next.js + React 追加） |
| `@chordbook/prettier-config` | 共有 Prettier 設定 |

**主な Prettier 設定:** `semi: false`, `singleQuote: true`, `printWidth: 100`, `trailingComma: "es5"`

**主な ESLint ルール:**
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: error（`_` プレフィックスで無視可）
- `@typescript-eslint/consistent-type-imports`: error（`import type` を強制）

```bash
# ルートから全ワークスペース一括実行
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check

# アプリ個別実行
pnpm --filter chordbook-frontend lint
pnpm --filter chordbook-backend lint
```

---

## バックエンド（TypeScript/Hono）

### ファイル命名

| 種類 | 規則 | 例 |
|------|------|-----|
| ルート | camelCase | `songs.ts` |
| サービス | camelCase（.service suffix） | `song.service.ts` |
| ミドルウェア | camelCase | `auth.ts` |
| スキーマ | camelCase | `schema.ts` |
| 型定義 | camelCase | `index.ts` |

### 命名規則

```typescript
// 変数: camelCase
const songTitle = "Sample"
const isPublic = true

// 定数: UPPER_SNAKE_CASE or PascalCase オブジェクト
const Visibility = { Private: 0, UrlOnly: 1, Public: 3 } as const

// 関数: camelCase（動詞で始める）
export async function listSongs(userId?: string) { }
export async function createSong(userId: string, data: CreateSongInput) { }
export async function getSongById(id: string, userId?: string) { }

// 型: PascalCase
type SongDto = { ... }
type SongListItemDto = { ... }
```

### Hono ルート定義

```typescript
// routes/songs.ts
const songs = new Hono<{ Variables: AuthVariables }>();

// Zod バリデーション付き
songs.post(
  "/",
  authMiddleware(),
  zValidator("json", createSongSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Validation failed", details: result.error.issues }, 400);
    }
  }),
  async (c) => {
    const userId = c.get("userId")!;
    const data = c.req.valid("json");
    const song = await createSong(userId, data);
    return c.json(song, 201);
  }
);
```

### Drizzle ORM クエリ

```typescript
// メソッドチェーンで読みやすく
const result = await db
  .select({
    id: songsTable.id,
    title: songsTable.title,
    artist: songsTable.artist,
    key: songsTable.key,
    updatedAt: songsTable.updatedAt,
  })
  .from(songsTable)
  .where(eq(songsTable.userId, userId))
  .orderBy(desc(songsTable.updatedAt));
```

---

## Git コミットメッセージ

### 形式

```
<type>: <subject>

<body>（オプション）
```

### Type

| Type | 説明 |
|------|------|
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメント |
| style | コードスタイル（フォーマット等） |
| refactor | リファクタリング |
| test | テスト |
| chore | ビルド・CI 設定等 |

### 例

```
feat: 楽曲の共有リンク機能を追加

- SongShare エンティティを追加
- 共有トークン生成ロジックを実装
- 有効期限の検証機能を追加
```

```
fix: 楽曲更新時にUpdatedAtが更新されない問題を修正
```

---

## コメント

### いつ書くか

- 「なぜ」そうしたかを説明する場合
- 複雑なビジネスロジック
- TODO / FIXME / HACK

### いつ書かないか

- コードを読めば分かること
- 関数名や変数名で説明できること

```typescript
// Bad: コードを読めば分かる
// タイトルを取得する
const title = song.title

// Good: なぜそうするかを説明
// BPM が未設定の場合はデフォルト値を使用（メトロノーム機能で必要）
const bpm = song.bpm ?? 120
```

## 関連ドキュメント

- [Git運用ルール](./git-workflow.md)
- [テスト](./testing.md)
