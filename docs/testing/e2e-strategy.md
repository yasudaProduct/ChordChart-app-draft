# E2Eテスト戦略

## 概要

PlaywrightによるE2Eテストを導入し、ユーザーの実操作に近い形でアプリケーションの品質を担保する。

## ツール

- **Playwright** (TypeScript)
- **Docker** - ローカルPostgreSQL環境
- ブラウザ: Chromium（CI/ローカル共通）

## 実行タイミング

| タイミング | トリガー                   | 備考                                       |
| ---------- | -------------------------- | ------------------------------------------ |
| ローカル   | `pnpm e2e` で任意実行      | `playwright.config.ts` がフロントを起動    |
| CI         | プルリクエスト作成・更新時 | `.github/workflows/ci.yml` の `e2e` ジョブ |

## ローカルDB環境

### 方針

E2Eテストは **Dockerのローカル PostgreSQL** を使用する。本番DBへの影響を完全に排除する。

### ローカル環境

```bash
# DB起動
docker compose up -d

# DBリセット（スキーマ再適用）
cd apps/backend && pnpm db:push

# シードデータ投入
cd apps/backend && pnpm db:seed
```

### CI環境

GitHub Actions（`.github/workflows/ci.yml`）では以下を実行:

1. 依存関係のインストール
2. Playwright ブラウザ（Chromium）のインストール
3. `playwright test` 実行（`playwright.config.ts` の `webServer` でフロントエンドを `pnpm build && pnpm start` で起動）
4. テスト結果を PR コメントに投稿、レポートを Artifact として保存

CI ではバックエンドや Docker PostgreSQL は起動しません。Clerk 認証テストには `@clerk/testing` を使用します。

### シードデータ

`apps/backend/src/db/seed.ts` にテスト用データを定義:

| テーブル | データ             | 用途             |
| -------- | ------------------ | ---------------- |
| Users    | test01@example.com | 楽曲操作テスト   |
| Songs    | サンプル楽曲15件   | 一覧・詳細テスト |

## 認証（Clerk）

E2Eテストでの Clerk 認証には `@clerk/testing`（`e2e/global-setup.ts` で `clerkSetup()`）を使用します。ローカルでは `.env.e2e` にテスト用キーを設定してください。

```bash
# .env.e2e
E2E_USER_EMAIL=test01@example.com
E2E_USER_PASSWORD=password123
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXX
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## テスト方針

### UI変更への耐性

UIは頻繁に変更される前提で、以下の方針でテストを壊れにくくする:

1. **`data-testid` 属性でセレクタを統一** - CSSクラスやDOM構造に依存しない
2. **ユーザー視点のアサーション** - テキスト内容やページ遷移で検証する
3. **Page Object Model (POM)** - ページ操作をクラスに集約し、UI変更時の修正箇所を1箇所に限定する

### テストの独立性

- 各テストは独立して実行可能
- テストデータはシードデータで管理（環境変数にはデフォルト値あり）
- 認証状態の共有は `storageState` を活用

## テスト対象

### Phase 1: 認証（現在）

- ログインページの表示
- ログイン成功 → リダイレクト
- ログイン失敗 → エラー表示
- redirect パラメータ付きログイン
- 未認証ユーザーの保護ページアクセス → ログインリダイレクト
- ログアウト

### Phase 2: 楽曲管理（将来）

- 楽曲一覧表示
- 楽曲作成
- 楽曲編集
- 楽曲削除

### Phase 3: 共有・検索（将来）

- 楽曲共有
- 楽曲検索

## ディレクトリ構成

```
apps/frontend/
├── e2e/
│   ├── auth.spec.ts          # 認証保護・新規登録テスト
│   ├── login.spec.ts         # ログインテスト
│   ├── fixtures/
│   │   └── test-base.ts      # カスタムfixture（POM注入）
│   └── pages/
│       ├── login.page.ts     # ログインページPOM
│       └── register.page.ts  # 新規登録ページPOM
├── playwright.config.ts
└── .env.e2e                  # E2Eテスト用環境変数（gitignore対象、ローカル用）
```

## npm scripts

```json
{
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:headed": "playwright test --headed"
}
```
