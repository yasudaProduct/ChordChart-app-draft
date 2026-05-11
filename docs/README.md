# ChordBook ドキュメント

このディレクトリには ChordBook プロジェクトの技術ドキュメントが含まれています。

## 目次

### プロジェクト概要

- [コンセプト](./project/concept.md) - プロジェクトのビジョン、ターゲットユーザー、ロードマップ

### アーキテクチャ

- [システム概要](./architecture/overview.md) - システム全体の構成図と技術スタック
- [バックエンド](./architecture/backend.md) - Hono + Drizzle ORM の詳細
- [フロントエンド](./architecture/frontend.md) - Next.js App Router の構成

### 開発ガイド

- [環境構築](./development/getting-started.md) - 開発環境のセットアップ手順
- [コーディング規約](./development/coding-standards.md) - コードスタイルと命名規則
- [Git運用ルール](./development/git-workflow.md) - ブランチ戦略とコミットルール
- [テスト](./development/testing.md) - テスト方針と実行方法

### API

- [API概要](./api/overview.md) - 認証方式とエラーハンドリング
- [エンドポイント](./api/endpoints.md) - REST API エンドポイント一覧
- `docs/api/openapi.yaml` - OpenAPI（仕様の一次情報）

### データベース

- [ER図](./database/er-diagram.md) - エンティティ関連図
- [テーブル定義](./database/tables.md) - 各テーブルのカラム詳細

### インフラ

- [インフラ構成概要](./infrastructure/overview.md) - Cloudflare / Neon / Clerk の構成まとめ
- [ステージング環境セットアップ](./infrastructure/staging-setup.md) - 動作確認環境の初回構築手順

### デプロイ・運用

- [環境変数](./deployment/environments.md) - 環境変数一覧と設定方法
- [フロントエンドデプロイ](./deployment/frontend-deploy.md) - Cloudflare Pages へのデプロイ手順
- [バックエンドデプロイ](./deployment/backend-deploy.md) - Cloudflare Workers へのデプロイ手順
- [トラブルシューティング](./deployment/troubleshooting.md) - よくある問題と解決方法

### UI/UX

- [画面一覧](./ui/screens.md) - 全画面の詳細仕様
- [画面遷移図](./ui/screen-flow.md) - 画面間の遷移フロー

### 機能仕様

- [機能一覧](./features/overview.md) - アプリケーションの機能概要

## クイックリンク

| 用途 | リンク |
|------|--------|
| プロジェクトを理解する | [コンセプト](./project/concept.md) |
| 画面仕様を見る | [画面一覧](./ui/screens.md) |
| 開発を始める | [環境構築](./development/getting-started.md) |
| APIを使う | [エンドポイント](./api/endpoints.md) |
| DB設計を見る | [ER図](./database/er-diagram.md) |
| デプロイする | [環境変数](./deployment/environments.md) |
