# Git 運用ルール

ChordBook プロジェクトの Git ブランチ戦略とワークフローです。

## ブランチ戦略

`develop` をステージング、`main` を本番とする 2 段構成。作業ブランチは `develop` から切る。

```
main ─────────────────────────────────────────────▶ 本番（承認後にデプロイ）
  ▲                                       ▲
  │ PR（リリース）                          │ PR（hotfix）
  │                                       │
develop ──────────────────────────────────┴───────▶ ステージング（push で自動デプロイ）
  ▲                       ▲
  │ PR                    │ PR
feature/add-share      fix/song-update
```

## ブランチ種類

| ブランチ    | 用途                                    | 命名規則         |
| ----------- | --------------------------------------- | ---------------- |
| main        | 本番環境（push で承認付き自動デプロイ） | -                |
| develop     | ステージング環境（push で自動デプロイ） | -                |
| feature/\*  | 新機能開発（`develop` から分岐）        | `feature/機能名` |
| fix/\*      | バグ修正（`develop` から分岐）          | `fix/修正内容`   |
| docs/\*     | ドキュメント更新                        | `docs/内容`      |
| refactor/\* | リファクタリング                        | `refactor/内容`  |

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
# develop から最新を取得
git checkout develop
git pull origin develop

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

自動デプロイ:

| ブランチ  | 環境         | ワークフロー                              | 承認                       |
| --------- | ------------ | ----------------------------------------- | -------------------------- |
| `develop` | ステージング | `.github/workflows/deploy-staging.yml`    | なし                       |
| `main`    | 本番         | `.github/workflows/deploy-production.yml` | 必要（Required reviewers） |

いずれも共通の `.github/workflows/deploy.yml` を呼び出します。詳細は [本番環境セットアップ](../infrastructure/production-setup.md) を参照。

## 本番リリース手順

1. `develop` の内容がステージングで動作確認済みであることを確認する
2. `develop` → `main` の Pull Request を作成する（`gh pr create --base main --head develop`）
3. マージすると **Deploy Production** が起動し、事前検証（lint / test / build）が走る
4. Actions 画面の **Review deployments** から `production` を承認する
5. デプロイ完了後、本番 URL で動作確認する

> 破壊的なスキーマ変更（カラム削除・型変更など）を含む場合は、承認する前に Neon でバックアップブランチを作成してください。詳細は [本番環境セットアップ](../infrastructure/production-setup.md) の「ロールバック」を参照。

## 緊急対応（Hotfix）

本番で緊急対応が必要な場合は `main` から直接ブランチを作成します。

```bash
# main から直接ブランチ作成
git checkout main
git pull origin main
git checkout -b fix/critical-auth-bug

# 修正・コミット・プッシュ
git commit -m "fix: 認証トークンの検証エラーを修正"
git push -u origin fix/critical-auth-bug

# main への PR を作成 → マージ → 承認して本番デプロイ
gh pr create --base main
```

マージ後、同じ修正を `develop` にも取り込みます（忘れると次のリリースで先祖返りする）。

```bash
git checkout develop
git pull origin develop
git merge origin/main
git push origin develop
```

## よくある操作

### 作業中に develop の変更を取り込む

```bash
git fetch origin develop
git rebase origin/develop

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
