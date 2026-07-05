# フロントエンドアーキテクチャ

Next.js 14 を使用したフロントエンドの設計を説明します。

## 技術スタック

| 技術         | バージョン | 用途                                   |
| ------------ | ---------- | -------------------------------------- |
| Next.js      | 14         | React フレームワーク                   |
| React        | 18.3       | UI ライブラリ                          |
| TypeScript   | 5.4        | 型安全な開発                           |
| Tailwind CSS | 3.4        | スタイリング                           |
| Zustand      | 4.5        | クライアント状態管理                   |
| SWR          | 2.4        | サーバーデータ取得                     |
| Clerk        | 6.x        | 認証                                   |
| tonal        | 6.x        | 音楽理論（移調・キー検出・コード解析） |
| Vitest       | 2.x        | lib/ の純粋関数のユニットテスト        |

## ディレクトリ構成

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # ホームページ
│   │   ├── login/              # ログイン
│   │   ├── register/           # 新規登録
│   │   ├── profile/            # マイページ
│   │   ├── songs/              # 楽曲一覧・詳細・新規作成
│   │   ├── editor/[id]/        # エディター
│   │   ├── demo/               # デモモード
│   │   ├── search/             # 検索
│   │   └── share/[token]/      # 共有リンク
│   │
│   ├── components/             # UI・機能コンポーネント
│   │   ├── ui/                 # 共通 UI（Button, Input 等）
│   │   ├── layout/             # レイアウト
│   │   ├── editor/             # エディター
│   │   ├── song/               # 楽曲表示
│   │   ├── profile/            # プロフィール
│   │   └── auth/               # 認証 UI
│   │
│   ├── hooks/                  # カスタムフック（useSong, useMe 等）
│   ├── lib/                    # API クライアント・ユーティリティ
│   │   └── music/              # 音楽理論ロジック（移調・キー検出・コード補完）
│   ├── stores/                 # Zustand ストア
│   ├── types/                  # TypeScript 型定義
│   └── styles/
│       └── globals.css
│
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## App Router

Next.js 14 の App Router を採用しています。

### ルーティング規則

| パス             | ファイル                     | 説明         |
| ---------------- | ---------------------------- | ------------ |
| `/`              | `app/page.tsx`               | ホームページ |
| `/login`         | `app/login/page.tsx`         | ログイン     |
| `/register`      | `app/register/page.tsx`      | 新規登録     |
| `/profile`       | `app/profile/page.tsx`       | マイページ   |
| `/songs`         | `app/songs/page.tsx`         | 楽曲一覧     |
| `/songs/123`     | `app/songs/[id]/page.tsx`    | 楽曲詳細     |
| `/songs/new`     | `app/songs/new/page.tsx`     | 新規作成     |
| `/editor/123`    | `app/editor/[id]/page.tsx`   | エディター   |
| `/demo`          | `app/demo/page.tsx`          | デモ一覧     |
| `/search`        | `app/search/page.tsx`        | 曲検索       |
| `/share/[token]` | `app/share/[token]/page.tsx` | 共有リンク   |

### 特殊ファイル

| ファイル        | 用途                                   |
| --------------- | -------------------------------------- |
| `layout.tsx`    | 共通レイアウト（ヘッダー、フッター等） |
| `page.tsx`      | ページコンポーネント                   |
| `loading.tsx`   | ローディング UI                        |
| `error.tsx`     | エラーハンドリング                     |
| `not-found.tsx` | 404 ページ                             |

## 状態管理（Zustand）

シンプルで軽量な状態管理ライブラリを使用。

### authStore（認証状態）

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
```

**使用例**:

```tsx
function Header() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <Skeleton />;
  if (!user) return <LoginButton />;
  return <UserMenu user={user} />;
}
```

### editorStore（エディター状態）

```typescript
interface EditorState {
  song: Song | null;
  isPreviewVisible: boolean;
  isDirty: boolean;
  setSong: (song: Song) => void;
  updateSong: (updates: Partial<Song>) => void;
  togglePreview: () => void;
  setDirty: (dirty: boolean) => void;
}
```

**使用例**:

```tsx
function Editor() {
  const { song, updateSong, isDirty } = useEditorStore();

  const handleTitleChange = (title: string) => {
    updateSong({ title }); // 自動的に isDirty = true
  };

  return (
    <div>
      {isDirty && <span>未保存の変更があります</span>}
      <input
        value={song?.title}
        onChange={(e) => handleTitleChange(e.target.value)}
      />
    </div>
  );
}
```

## API クライアント

`src/lib/api.ts` で統一的な API 呼び出しを提供。

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: "POST", body }),
  put: <T>(endpoint: string, body: unknown) =>
    apiClient<T>(endpoint, { method: "PUT", body }),
  delete: <T>(endpoint: string) => apiClient<T>(endpoint, { method: "DELETE" }),
};
```

**使用例**:

```typescript
// 楽曲一覧取得
const songs = await api.get<SongListItem[]>("/songs");

// 楽曲作成
const newSong = await api.post<Song>("/songs", {
  title: "新しい曲",
  artist: "アーティスト",
});

// 楽曲更新
await api.put(`/songs/${id}`, updatedSong);
```

## 型定義

### song.ts（楽曲関連）

```typescript
export type SectionType = "lyrics-chord" | "bar";

export interface Section {
  id: string;
  name: string;
  type: SectionType;
  lines: LyricsChordLine[] | BarLine[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  timeSignature: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
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

### 共通 UI コンポーネント

`src/components/ui/` に Button、Input、Dialog 等の共通コンポーネントを配置しています。Tailwind CSS でスタイリングします。

## データ取得（SWR）

`src/lib/swr.ts` と `src/components/providers/SWRProvider.tsx` で SWR を設定。`useSong`、`useMe` 等のフックで API データを取得・キャッシュします。

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

| 変数                              | 説明                   |
| --------------------------------- | ---------------------- |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk 公開キー         |
| CLERK_SECRET_KEY                  | Clerk シークレットキー |
| NEXT_PUBLIC_API_URL               | バックエンド API URL   |

**注意**: `NEXT_PUBLIC_` プレフィックスの変数はブラウザに公開されます。

## 関連ドキュメント

- [システム概要](./overview.md) - 全体アーキテクチャ
- [環境構築](../development/getting-started.md) - 開発環境セットアップ
- [環境変数](../deployment/environments.md) - 設定詳細
