---
name: update-docs
description: >
  コード・設定・アーキテクチャに変更を加えた後、プロジェクトドキュメントを最新の状態に保つ。
  以下の場面では必ずこのスキルを使うこと：パッケージの追加・削除・設定変更、
  package.json の scripts 変更、CI/ワークフローファイルの変更、
  新機能・アーキテクチャの変更、コーディング規約の変更、DB スキーマの変更。
  ユーザーに聞かれなくても、構造的・動作的な変更を含むタスクの完了時に自律的にドキュメントを確認・更新すること。
---

# ドキュメント更新スキル

## ドキュメントの責務分担

各ドキュメントが「何を所有するか」を理解することで重複を防ぐ。

| ファイル | 責務 | 詳細度 |
|---------|------|-------|
| `CLAUDE.md` | AIコンテキスト・コマンド早見表・アーキテクチャ概要 | **簡潔**（毎セッション読み込まれる） |
| `README.md` | 開発者向け導入・セットアップ手順 | **中程度** |
| `docs/development/getting-started.md` | 詳細な環境構築ガイド | 詳細 |
| `docs/development/coding-standards.md` | コーディング規約・フォーマット設定 | 詳細 |
| `docs/development/git-workflow.md` | Git運用ルール | 詳細 |
| `docs/api/endpoints.md` | REST API仕様 | 詳細 |
| `docs/architecture/` | システム構成・データフロー | 詳細 |
| `docs/database/` | DBスキーマ・テーブル定義 | 詳細 |
| `docs/deployment/` | デプロイ・環境変数設定 | 詳細 |

## ドキュメントルール

### Rule 1: Single Source of Truth
情報は必ず一箇所にのみ存在する。他の箇所から参照する場合は「概要 + リンク」に留める。

```
❌ 悪い例: CLAUDE.md と getting-started.md の両方に同じ手順を書く
✅ 良い例: getting-started.md に詳細を書き、CLAUDE.md には概要と「→ 詳細は docs/development/getting-started.md」を記載
```

**例外 — コマンド**: コマンドは `CLAUDE.md`（一覧のみ、説明なし）と関連 `docs/` ファイル（説明付き）の両方に記載してよい。ただしコマンド自体は両者で一致させること。

### Rule 2: 詳細は docs/ に置く
- 詳細な手順・説明 → `docs/` サブディレクトリ
- 概要 → `CLAUDE.md` / `README.md` に「→ 詳細は `docs/xxx.md` 参照」と書く

### Rule 3: CLAUDE.md は簡潔に保つ
CLAUDE.md は毎セッションで読み込まれる。セクションが数行を超えたら `docs/` に切り出し、概要 + リンクに置き換えること。

### Rule 4: 更新スコープは最小限に
今回の変更に直接関係するドキュメントのみを更新する。無関係な既存ドキュメントを書き換えない。

## 作業手順

### Step 1: 変更内容を把握する

今回のセッションで変更したファイルを確認し、どのドキュメントに影響するかを判断する。

| 変更の種類 | 影響するドキュメント |
|-----------|------------------|
| `package.json`・`pnpm-workspace.yaml`・パッケージ変更 | `CLAUDE.md` コマンド、`README.md` セットアップ、`getting-started.md` |
| `package.json` の `scripts` 変更 | `CLAUDE.md` コマンドセクション |
| `.github/workflows/` 変更 | `getting-started.md`、`docs/deployment/` |
| `apps/backend/src/routes/` 変更 | `docs/api/endpoints.md` |
| `apps/backend/src/db/schema.ts` 変更 | `docs/database/` |
| `packages/eslint-config/`・`packages/prettier-config/` 変更 | `docs/development/coding-standards.md` |
| アーキテクチャレベルの変更 | `docs/architecture/`、`CLAUDE.md` アーキテクチャセクション |
| 新機能追加 | `docs/features/`、`README.md`（大きな変更の場合） |
| DB スキーマ変更 | `docs/database/`、`docs/api/endpoints.md`（レスポンス変化の場合） |

### Step 2: 対象ドキュメントの現状確認

特定したドキュメントを読む。各ファイルについて確認する：
- 情報が現在のコードと一致しているか
- 追加すべき情報がないか
- 削除・修正すべき古い情報がないか

### Step 3: 最小限の更新を適用する

各更新において：
1. **責務の確認**: 更新内容はそのドキュメントの責務に属するか
2. **重複チェック**: 追加する情報が他のドキュメントにすでに存在しないか
3. **ルール適用**: 詳細なら `docs/` へ、概要なら上位ドキュメントにリンクを置く
4. **コマンド同期**: コマンドを変更した場合、`CLAUDE.md` と `docs/` で一致しているか確認

### Step 4: 重複がないか最終確認

更新後、同じ情報が複数箇所に存在していないか確認する。存在する場合は、詳細が置かれるべき場所に残し、他は概要 + リンクに置き換える。
