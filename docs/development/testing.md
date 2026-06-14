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

| レベル   | 対象             | ツール          |
| -------- | ---------------- | --------------- |
| ユニット | ルート・サービス | vitest (BE)     |
| E2E      | ユーザーフロー   | Playwright (FE) |

---

## バックエンド（TypeScript/Hono）

### テストプロジェクト構成

```
apps/backend/
├── src/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── db/
└── test/                      # テストファイル
    └── routes/                # ルートテスト（health, songs, me）
```

### ユニットテスト例

```typescript
// tests/services/song.service.test.ts
import { describe, it, expect, vi } from "vitest";

describe("song.service", () => {
  it("listSongs returns public songs when no userId", async () => {
    const songs = await listSongs();
    expect(songs).toBeDefined();
    expect(Array.isArray(songs)).toBe(true);
  });
});
```

### 統合テスト例

```typescript
// tests/routes/songs.test.ts
import { describe, it, expect } from "vitest";
import { app } from "../../src/app";

describe("GET /api/songs", () => {
  it("returns 200 with song list", async () => {
    const res = await app.request("/api/songs");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("POST /api/songs", () => {
  it("returns 401 without auth token", async () => {
    const res = await app.request("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });
    expect(res.status).toBe(401);
  });
});
```

### テスト実行

```bash
cd apps/backend

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

## フロントエンド（E2E）

フロントエンドの自動テストは Playwright による E2E テスト（`apps/frontend/e2e/`）を中心に実施します。コンポーネント単体テスト（Jest 等）は現時点では未導入です。

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
import { test, expect } from "@playwright/test";

test.describe("Songs", () => {
  test("should display song list", async ({ page }) => {
    await page.goto("/songs");

    // 楽曲一覧が表示される
    await expect(page.getByRole("heading", { name: "楽曲一覧" })).toBeVisible();
  });

  test("should create new song", async ({ page }) => {
    await page.goto("/songs/new");

    // フォーム入力
    await page.getByLabel("曲名").fill("新しい曲");
    await page.getByLabel("アーティスト").fill("テストアーティスト");
    await page.getByRole("button", { name: "作成" }).click();

    // 詳細ページに遷移
    await expect(page).toHaveURL(/\/songs\/[a-z0-9-]+/);
    await expect(page.getByText("新しい曲")).toBeVisible();
  });
});
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

| 優先度 | 対象                           |
| ------ | ------------------------------ |
| 高     | ビジネスロジック（Service 層） |
| 高     | API エンドポイントの正常系     |
| 中     | バリデーション（Zod スキーマ） |
| 中     | エラーハンドリング             |
| 低     | UI のスタイル                  |

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
          node-version: "20"
      - run: |
          cd apps/backend
          pnpm install
          pnpm test

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: |
          cd apps/frontend
          pnpm install
          pnpm test
```

## 関連ドキュメント

- [コーディング規約](./coding-standards.md)
- [環境構築](./getting-started.md)
