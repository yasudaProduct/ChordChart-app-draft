# テスト

ChordBook プロジェクトのテスト方針と実行方法です。

## テスト戦略

### テストピラミッド

```
        ┌───────────┐
        │   E2E     │  少数・重要フロー
        ├───────────┤
        │ 統合テスト │  API・DB連携
        ├───────────┤
        │ ユニット   │  多数・高速
        └───────────┘
```

| レベル | 対象 | ツール |
|--------|------|--------|
| ユニット | 関数・モジュール単体 | vitest (BE), Jest (FE) |
| 統合 | API エンドポイント | vitest + supertest |
| E2E | ユーザーフロー | Playwright |

---

## バックエンド（TypeScript/Hono）

### テストプロジェクト構成

```
apps/backend-hono/
├── src/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── db/
└── tests/                     # テストファイル
    ├── routes/                # ルートテスト
    ├── services/              # サービステスト
    └── setup.ts               # テストセットアップ
```

### ユニットテスト例

```typescript
// tests/services/song.service.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('song.service', () => {
  it('listSongs returns public songs when no userId', async () => {
    const songs = await listSongs()
    expect(songs).toBeDefined()
    expect(Array.isArray(songs)).toBe(true)
  })
})
```

### 統合テスト例

```typescript
// tests/routes/songs.test.ts
import { describe, it, expect } from 'vitest'
import { app } from '../../src/app'

describe('GET /api/songs', () => {
  it('returns 200 with song list', async () => {
    const res = await app.request('/api/songs')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('POST /api/songs', () => {
  it('returns 401 without auth token', async () => {
    const res = await app.request('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    })
    expect(res.status).toBe(401)
  })
})
```

### テスト実行

```bash
cd apps/backend-hono

# 全テスト実行
pnpm test

# ウォッチモード
pnpm test -- --watch

# カバレッジ
pnpm test -- --coverage

# 特定ファイル
pnpm test -- songs.test.ts
```

---

## フロントエンド（TypeScript/React）

### テストツール

| ツール | 用途 |
|--------|------|
| Jest | テストランナー |
| React Testing Library | コンポーネントテスト |
| MSW | API モック |

### ユニットテスト例

```typescript
// __tests__/utils/formatDate.test.ts
import { formatDate } from '@/lib/utils'

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = '2024-01-15T10:30:00Z'
    const result = formatDate(date)
    expect(result).toBe('2024/01/15')
  })

  it('returns empty string for invalid date', () => {
    const result = formatDate('invalid')
    expect(result).toBe('')
  })
})
```

### コンポーネントテスト例

```typescript
// __tests__/components/SongCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SongCard } from '@/components/SongCard'

describe('SongCard', () => {
  const mockSong = {
    id: '1',
    title: 'Test Song',
    artist: 'Test Artist',
    key: 'C',
    updatedAt: '2024-01-15',
  }

  it('renders song information', () => {
    render(<SongCard song={mockSong} onSelect={jest.fn()} />)

    expect(screen.getByText('Test Song')).toBeInTheDocument()
    expect(screen.getByText('Test Artist')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn()
    render(<SongCard song={mockSong} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith('1')
  })
})
```

### API モック（MSW）

```typescript
// __tests__/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/songs', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', title: 'Song 1', artist: 'Artist 1' },
        { id: '2', title: 'Song 2', artist: 'Artist 2' },
      ])
    )
  }),
]
```

### テスト実行

```bash
cd apps/frontend

# 全テスト実行
pnpm test

# ウォッチモード
pnpm test --watch

# カバレッジ
pnpm test --coverage

# 特定ファイル
pnpm test SongCard.test.tsx
```

---

## E2E テスト（Playwright）

### セットアップ

```bash
cd apps/frontend
pnpm add -D @playwright/test
npx playwright install
```

### E2E テスト例

```typescript
// e2e/songs.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Songs', () => {
  test('should display song list', async ({ page }) => {
    await page.goto('/songs')

    // 楽曲一覧が表示される
    await expect(page.getByRole('heading', { name: '楽曲一覧' })).toBeVisible()
  })

  test('should create new song', async ({ page }) => {
    await page.goto('/songs/new')

    // フォーム入力
    await page.getByLabel('曲名').fill('新しい曲')
    await page.getByLabel('アーティスト').fill('テストアーティスト')
    await page.getByRole('button', { name: '作成' }).click()

    // 詳細ページに遷移
    await expect(page).toHaveURL(/\/songs\/[a-z0-9-]+/)
    await expect(page.getByText('新しい曲')).toBeVisible()
  })
})
```

### 実行

```bash
# 全 E2E テスト
npx playwright test

# UI モード
npx playwright test --ui

# 特定ブラウザ
npx playwright test --project=chromium
```

---

## テスト方針

### 何をテストするか

| 優先度 | 対象 |
|--------|------|
| 高 | ビジネスロジック（Service 層） |
| 高 | API エンドポイントの正常系 |
| 中 | バリデーション（Zod スキーマ） |
| 中 | エラーハンドリング |
| 低 | UI のスタイル |

### テストのベストプラクティス

1. **Arrange-Act-Assert パターン**を使う
2. **1テスト1検証**を心がける
3. **テストは独立**させる（順序依存なし）
4. **実装ではなく振る舞い**をテストする
5. **意味のあるテスト名**をつける

```typescript
// Good: 振る舞いを説明するテスト名
it('returns 404 when song does not exist', async () => { ... })

// Bad: 実装詳細を含むテスト名
it('calls db.select', async () => { ... })
```

---

## CI でのテスト

GitHub Actions で PR 時に自動実行:

```yaml
# .github/workflows/ci.yml
jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd apps/backend-hono
          pnpm install
          pnpm test

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd apps/frontend
          pnpm install
          pnpm test
```

## 関連ドキュメント

- [コーディング規約](./coding-standards.md)
- [環境構築](./getting-started.md)
