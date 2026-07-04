# Git 運用ルール

ChordBook プロジェクトの Git ブランチ戦略とワークフローです。

## ブランチ戦略

GitHub Flow をベースにしたシンプルな運用を採用。

```
main ─────────────────────────────────────────────────────────────▶
       │                      │                      │
       │                      │                      │
       ▼                      ▼                      ▼
  feature/add-share     fix/song-update       feature/export-pdf
       │                      │                      │
       └──────── PR ──────────┴──────── PR ──────────┘
```

## ブランチ種類

| ブランチ    | 用途                         | 命名規則         |
| ----------- | ---------------------------- | ---------------- |
| main        | 本番環境（将来のリリース用） | -                |
| develop     | ステージング自動デプロイ     | -                |
| feature/\*  | 新機能開発                   | `feature/機能名` |
| fix/\*      | バグ修正                     | `fix/修正内容`   |
| docs/\*     | ドキュメント更新             | `docs/内容`      |
| refactor/\* | リファクタリング             | `refactor/内容`  |

## ブランチ命名例

```bash
# 新機能
feature/add-song-share
feature/user-profile
feature/export-pdf

# バグ修正
fix/song-update-error
fix/auth-token-expired

# ドキュメント
docs/api-specification
docs/setup-guide

# リファクタリング
refactor/song-entity
refactor/api-client
```

## 開発フロー

### 1. ブランチ作成

```bash
# main から最新を取得
git checkout main
git pull origin main

# 作業ブランチを作成
git checkout -b feature/add-song-share
```

### 2. 開発・コミット

```bash
# 変更をステージング
git add src/features/share/

# コミット
git commit -m "feat: 楽曲共有リンクの生成機能を追加"
```

### 3. プッシュ

```bash
git push -u origin feature/add-song-share
```

### 4. Pull Request 作成

GitHub で Pull Request を作成:

- タイトル: 変更内容を簡潔に
- 説明: 変更の詳細、テスト方法、スクリーンショット等

### 5. レビュー・マージ

- レビュー承認後、Squash and merge を推奨
- マージ後、作業ブランチは削除

## コミットルール

### コミットメッセージ形式

```
<type>: <subject>

<body>（オプション）

<footer>（オプション）
```

### Type 一覧

| Type     | 説明             | 例                                    |
| -------- | ---------------- | ------------------------------------- |
| feat     | 新機能追加       | `feat: ブックマーク機能を追加`        |
| fix      | バグ修正         | `fix: ログイン時のエラーを修正`       |
| docs     | ドキュメント     | `docs: API仕様書を更新`               |
| style    | コードスタイル   | `style: コードフォーマットを修正`     |
| refactor | リファクタリング | `refactor: SongServiceを分割`         |
| test     | テスト           | `test: SongController のテストを追加` |
| chore    | その他           | `chore: 依存関係を更新`               |

### コミットの粒度

- 1コミット = 1つの論理的な変更
- コンパイルエラーやテスト失敗の状態でコミットしない
- WIP（Work In Progress）コミットは PR 前に squash

```bash
# 良い例：論理的な単位でコミット
git commit -m "feat: SongShare エンティティを追加"
git commit -m "feat: 共有トークン生成APIを追加"
git commit -m "test: SongShare のユニットテストを追加"

# 悪い例：変更を1つのコミットにまとめすぎ
git commit -m "feat: 共有機能を追加（エンティティ、API、テスト）"
```

## Pull Request ルール

### タイトル

コミットメッセージと同じ形式:

```
feat: 楽曲の共有リンク機能を追加
```

### 説明テンプレート

```markdown
## 概要

楽曲を共有リンクで公開できる機能を追加しました。

## 変更内容

- SongShare エンティティを追加
- POST /api/songs/{id}/share エンドポイントを追加
- 共有リンクの有効期限設定機能

## テスト方法

1. 楽曲詳細画面で「共有」ボタンをクリック
2. 生成されたURLをコピー
3. シークレットウィンドウでURLにアクセス
4. 楽曲が表示されることを確認

## スクリーンショット

（UI変更がある場合）
```

### チェックリスト

PR 作成時に確認:

- [ ] ローカルでビルドが通る
- [ ] テストが通る
- [ ] Lint エラーがない
- [ ] 不要なコメントや console.log を削除した

## CI/CD

GitHub Actions で自動チェック（`.github/workflows/ci.yml`）:

| ジョブ   | 内容                                              |
| -------- | ------------------------------------------------- |
| frontend | pnpm lint, pnpm build                             |
| backend  | pnpm lint, pnpm build, pnpm test                  |
| e2e      | Playwright（PR 時のみ。結果を PR コメントに投稿） |

ステージングへの自動デプロイは `develop` ブランチへのプッシュで `.github/workflows/deploy-staging.yml` が実行されます。詳細は [インフラ構成概要](../infrastructure/overview.md) を参照。

## 緊急対応（Hotfix）

本番で緊急対応が必要な場合:

```bash
# main から直接ブランチ作成
git checkout main
git pull origin main
git checkout -b fix/critical-auth-bug

# 修正・コミット・プッシュ
git commit -m "fix: 認証トークンの検証エラーを修正"
git push -u origin fix/critical-auth-bug

# PR 作成→レビュー→マージ
```

## よくある操作

### 作業中に main の変更を取り込む

```bash
git fetch origin main
git rebase origin/main

# コンフリクトがあれば解決
git add .
git rebase --continue
```

### 直前のコミットを修正

```bash
# メッセージのみ修正
git commit --amend -m "新しいメッセージ"

# 内容も修正
git add .
git commit --amend
```

### コミットを整理（PR前）

```bash
# 直近3コミットを1つにまとめる
git rebase -i HEAD~3
# エディタで pick を squash に変更
```

## 関連ドキュメント

- [コーディング規約](./coding-standards.md)
- [環境構築](./getting-started.md)
