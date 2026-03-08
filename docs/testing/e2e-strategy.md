# E2Eテスト戦略

## 概要

PlaywrightによるE2Eテストを導入し、ユーザーの実操作に近い形でアプリケーションの品質を担保する。

## ツール

- **Playwright** (TypeScript)
- ブラウザ: Chromium（CI/ローカル共通）

## 実行タイミング

| タイミング | トリガー | 対象ブランチ |
|-----------|---------|-------------|
| ローカル | `pnpm e2e` で任意実行 | 任意 |
| CI | プルリクエスト作成・更新時 | main, develop |

## テスト方針

### UI変更への耐性

UIは頻繁に変更される前提で、以下の方針でテストを壊れにくくする:

1. **`data-testid` 属性でセレクタを統一** - CSSクラスやDOM構造に依存しない
2. **ユーザー視点のアサーション** - テキスト内容やページ遷移で検証する
3. **Page Object Model (POM)** - ページ操作をクラスに集約し、UI変更時の修正箇所を1箇所に限定する

### テストの独立性

- 各テストは独立して実行可能
- テストデータは環境変数で管理
- 認証状態の共有は `storageState` を活用

## テスト対象

### Phase 1: 認証（現在）
- ログインページの表示
- ログイン成功 → リダイレクト
- ログイン失敗 → エラー表示
- 新規登録ページの表示
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
│   ├── auth.spec.ts          # 認証テスト
│   ├── fixtures/
│   │   └── test-base.ts      # カスタムfixture（POM注入）
│   └── pages/
│       ├── login.page.ts     # ログインページPOM
│       └── register.page.ts  # 新規登録ページPOM
├── playwright.config.ts
└── .env.e2e                  # E2Eテスト用環境変数（gitignore対象）
```

## 環境変数

E2Eテストで使用する環境変数（`.env.e2e`）:

```
E2E_USER_EMAIL=<テスト用ユーザーのメールアドレス>
E2E_USER_PASSWORD=<テスト用ユーザーのパスワード>
```

CI上では GitHub Actions の Secrets として設定する。

## CI構成

GitHub Actionsで以下のフローを実行:

1. Node.js + pnpm セットアップ
2. 依存関係インストール
3. Playwright ブラウザインストール
4. Next.js ビルド
5. E2Eテスト実行（`pnpm e2e`）
6. テストレポートをアーティファクトとして保存

## npm scripts

```json
{
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:headed": "playwright test --headed"
}
```
