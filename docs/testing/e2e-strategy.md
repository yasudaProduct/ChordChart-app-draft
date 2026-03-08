# E2Eテスト戦略

## 概要

PlaywrightによるE2Eテストを導入し、ユーザーの実操作に近い形でアプリケーションの品質を担保する。

## ツール

- **Playwright** (TypeScript)
- **Supabase CLI** - ローカルDBとAuth環境
- ブラウザ: Chromium（CI/ローカル共通）

## 実行タイミング

| タイミング | トリガー | 対象ブランチ |
|-----------|---------|-------------|
| ローカル | `pnpm e2e` で任意実行 | 任意 |
| CI | プルリクエスト作成・更新時 | main, develop |

## Supabase環境

### 方針
E2Eテストは **Supabase CLIのローカル環境** を使用する。本番Supabaseへの影響を完全に排除する。

### ローカル環境
```bash
# 初回 or スキーマ変更時
supabase start          # ローカルSupabase起動（マイグレーション + シード自動適用）
supabase db reset       # DBリセット + シード再適用
supabase stop           # 停止
```

ローカルSupabase起動時に `supabase/seed.sql` が自動実行され、テスト用ユーザー（`test01@example.com` / `password123`）が作成される。

### CI環境
GitHub Actions上で以下のフローを実行:
1. Supabase CLI セットアップ
2. `supabase start`（マイグレーション + シード自動適用）
3. ローカルSupabaseの URL と anon key を取得
4. E2Eテスト実行（ローカルSupabaseに接続）
5. `supabase stop`（クリーンアップ）

CI上ではSupabase関連のSecretsは不要。すべてローカル環境で完結する。

### シードデータ
`supabase/seed.sql` にテスト用データを定義:

| テーブル | データ | 用途 |
|---------|--------|------|
| auth.users + auth.identities | test01@example.com / password123 | 認証テスト全般 |

auth.usersへのINSERTトリガーにより、`public.Users` テーブルにもレコードが自動作成される。

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
- 送信中のボタン無効化
- バリデーション（空入力の防止）
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
│   ├── auth.spec.ts          # 認証保護・新規登録テスト
│   ├── login.spec.ts         # ログインテスト
│   ├── fixtures/
│   │   └── test-base.ts      # カスタムfixture（POM注入）
│   └── pages/
│       ├── login.page.ts     # ログインページPOM
│       └── register.page.ts  # 新規登録ページPOM
├── playwright.config.ts
└── .env.e2e                  # E2Eテスト用環境変数（gitignore対象、ローカル用）

supabase/
├── config.toml               # Supabase設定
├── migrations/               # DBマイグレーション
└── seed.sql                  # テスト用シードデータ
```

## 環境変数

E2Eテストで使用する環境変数（`.env.e2e`）:

```
E2E_USER_EMAIL=test01@example.com      # デフォルト値あり（省略可）
E2E_USER_PASSWORD=password123           # デフォルト値あり（省略可）
```

ローカルSupabase使用時は以下も `.env.e2e` に設定:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase status で取得した anon key>
```

## npm scripts

```json
{
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:headed": "playwright test --headed"
}
```
