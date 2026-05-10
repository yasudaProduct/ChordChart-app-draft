# フロントエンドアーキテクチャ

Next.js 14 を使用したフロントエンドの設計を説明します。

## 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14 | React フレームワーク |
| React | 18.3 | UI ライブラリ |
| TypeScript | 5.4 | 型安全な開発 |
| Tailwind CSS | 3.4 | スタイリング |
| Zustand | 最新 | 状態管理 |
| shadcn/ui | 最新 | UI コンポーネント |

## ディレクトリ構成

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # ホームページ
│   │   ├── (auth)/             # 認証関連ページ（グループ）
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── songs/              # 楽曲関連ページ
│   │   │   ├── page.tsx        # 楽曲一覧
│   │   │   ├── [id]/           # 楽曲詳細（動的ルート）
│   │   │   └── new/            # 新規作成
│   │   └── editor/             # エディター
│   │       └── [id]/
│   │
│   ├── components/             # 共通コンポーネント
│   │   ├── ui/                 # shadcn/ui コンポーネント
│   │   ├── layout/             # レイアウトコンポーネント
│   │   └── features/           # 機能別コンポーネント
│   │
│   ├── lib/                    # ユーティリティ
│   │   ├── api.ts              # API クライアント
│   │   └── utils.ts            # 汎用ユーティリティ
│   │
│   ├── stores/                 # Zustand ストア
│   │   ├── authStore.ts        # 認証状態
│   │   └── editorStore.ts      # エディター状態
│   │
│   ├── types/                  # TypeScript 型定義
│   │   ├── api.ts              # API レスポンス型
│   │   └── song.ts             # 楽曲関連型
│   │
│   └── styles/                 # グローバルスタイル
│       └── globals.css
│
├── public/                     # 静的ファイル
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## App Router

Next.js 14 の App Router を採用しています。

### ルーティング規則

| パス | ファイル | 説明 |
|------|----------|------|
| `/` | `app/page.tsx` | ホームページ |
| `/songs` | `app/songs/page.tsx` | 楽曲一覧 |
| `/songs/123` | `app/songs/[id]/page.tsx` | 楽曲詳細 |
| `/songs/new` | `app/songs/new/page.tsx` | 新規作成 |
| `/editor/123` | `app/editor/[id]/page.tsx` | エディター |

### 特殊ファイル

| ファイル | 用途 |
|----------|------|
| `layout.tsx` | 共通レイアウト（ヘッダー、フッター等） |
| `page.tsx` | ページコンポーネント |
| `loading.tsx` | ローディング UI |
| `error.tsx` | エラーハンドリング |
| `not-found.tsx` | 404 ページ |

## 状態管理（Zustand）

シンプルで軽量な状態管理ライブラリを使用。

### authStore（認証状態）

```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
```

**使用例**:

```tsx
function Header() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <Skeleton />
  if (!user) return <LoginButton />
  return <UserMenu user={user} />
}
```

### editorStore（エディター状態）

```typescript
interface EditorState {
  song: Song | null
  isPreviewVisible: boolean
  isDirty: boolean
  setSong: (song: Song) => void
  updateSong: (updates: Partial<Song>) => void
  togglePreview: () => void
  setDirty: (dirty: boolean) => void
}
```

**使用例**:

```tsx
function Editor() {
  const { song, updateSong, isDirty } = useEditorStore()

  const handleTitleChange = (title: string) => {
    updateSong({ title })  // 自動的に isDirty = true
  }

  return (
    <div>
      {isDirty && <span>未保存の変更があります</span>}
      <input value={song?.title} onChange={e => handleTitleChange(e.target.value)} />
    </div>
  )
}
```

## API クライアント

`src/lib/api.ts` で統一的な API 呼び出しを提供。

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string) =>
    apiClient<T>(endpoint, { method: 'DELETE' }),
}
```

**使用例**:

```typescript
// 楽曲一覧取得
const songs = await api.get<SongListItem[]>('/songs')

// 楽曲作成
const newSong = await api.post<Song>('/songs', {
  title: '新しい曲',
  artist: 'アーティスト',
})

// 楽曲更新
await api.put(`/songs/${id}`, updatedSong)
```

## 型定義

### song.ts（楽曲関連）

```typescript
export type SectionType = 'lyrics-chord' | 'bar'

export interface Section {
  id: string
  name: string
  type: SectionType
  lines: LyricsChordLine[] | BarLine[]
}

export interface Song {
  id: string
  title: string
  artist: string
  key: string
  bpm: number
  timeSignature: string
  sections: Section[]
  createdAt: string
  updatedAt: string
}
```

## スタイリング

### Tailwind CSS

ユーティリティファースト CSS フレームワークを使用。

```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  保存
</button>
```

### shadcn/ui

Radix UI ベースの再利用可能なコンポーネント。

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

<Button variant="outline">キャンセル</Button>
<Button>保存</Button>
<Input placeholder="曲名を入力" />
```

## データフロー

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page Component                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   useEffect / useSWR                     │   │
│  │                          │                               │   │
│  │                          ▼                               │   │
│  │              api.get('/songs') → API                     │   │
│  │                          │                               │   │
│  │                          ▼                               │   │
│  │               Zustand Store 更新                          │   │
│  │                          │                               │   │
│  │                          ▼                               │   │
│  │                  UI 自動再レンダリング                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 環境変数

| 変数 | 説明 |
|------|------|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk 公開キー |
| CLERK_SECRET_KEY | Clerk シークレットキー |
| NEXT_PUBLIC_API_URL | バックエンド API URL |

**注意**: `NEXT_PUBLIC_` プレフィックスの変数はブラウザに公開されます。

## 関連ドキュメント

- [システム概要](./overview.md) - 全体アーキテクチャ
- [環境構築](../development/getting-started.md) - 開発環境セットアップ
- [環境変数](../deployment/environments.md) - 設定詳細
