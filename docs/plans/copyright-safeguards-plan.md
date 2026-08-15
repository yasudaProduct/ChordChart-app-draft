# 著作権リスク対応計画: 利用規約整備 ＋ 公開曲の通報機能

## 概要

ユーザー投稿型サービスである ChordBook において、ユーザーが第三者の著作権を有する歌詞等を無許諾で `public` 公開した場合の法的リスクに対応するため、以下 2 点を実施する。

1. **利用規約への明記** — 投稿コンテンツ（歌詞含む）の権利保証・禁止事項・運営者の削除権限を利用規約に規定する。
2. **公開曲の通報機能** — `visibility: public` の曲について、第三者が権利侵害等を運営者に報告できる仕組みを実装する。

これは `plans/feature-roadmap.md` の **E5（通報・モデレーション）**（同ファイル 114 行目、M3 拡大フェーズ）を、著作権対応という具体的な動機に基づき前倒し・スコープダウンして実行計画に落とし込んだものである。

> **経緯（2026-08-15）**: デモ曲データ（`demoSongs.ts`）に実在楽曲の歌詞を追加する相談から、「上を向いて歩こう」「チェリー」「Let It Be」がいずれも著作権保護期間中であることを確認。シードデータは実装せずコードのみとする方針が決定済み。合わせて、ユーザーが自ら歌詞を投稿・公開できる本サービスの構造自体に同様のリスクがあることを確認し、本計画を作成。

---

## 背景（法的整理のサマリ）

詳細な議論は本計画作成時の会話ログを参照。要点のみ整理する。

| 論点               | 整理                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| コードネームのみ   | 著作物の「表現」を再製するとは扱われず、無許諾でも一般的にリスクは低い                                                                          |
| 歌詞（非公開保存） | 投稿者本人の私的使用のための複製（著作権法 30 条）に近く、リスクは相対的に低い                                                                  |
| 歌詞（公開・共有） | `url_only` / `specific_users` / `public` で第三者に閲覧可能にした時点で「公衆送信」に該当し、**投稿したユーザー本人**が権利侵害の主体になり得る |
| 運営者の立場       | プロバイダ責任制限法により、違法投稿を知らない間は原則免責。ただし**権利者からの削除要請を放置すると運営者の責任も生じ得る**                    |

→ 運営者として実務上できる対応は、(a) 投稿者に責任の所在を明確化する利用規約、(b) 削除要請を受け付けて迅速に対応できる通報導線、の 2 点。今回はこれをスコープとする。

---

## スコープ

### 対象

- 利用規約への投稿コンテンツ条項の追加（新規に利用規約ページ自体を作る必要あり、後述）
- `visibility: public` の曲に対する通報機能（送信 API・UI、および運営者が確認・対応するための最小限の管理導線）

### 対象外（本計画では扱わない）

- JASRAC / NexTone 等とのライセンス契約締結（事業判断として別途検討）
- 歌詞の自動検出・自動フィルタリング（フィンガープリント照合等）
- `url_only` / `specific_users` の通報対応（第三者が到達しにくい経路のため優先度を下げる。将来 G4 実装後に再検討）
- プライバシーポリシー本文の作成（利用規約とセットで参照されているが、著作権論点とは別軸のため本計画では扱わない。ページの雛形だけは Part A で触れる）
- メール通知基盤の新規導入（現状 `apps/backend` に該当パッケージなし。v1 は管理画面のポーリング確認で運用し、通知の自動化は将来課題とする）

---

## 現状分析

| 項目                  | 現状                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 利用規約ページ        | **存在しない。** `AuthForm.tsx:86` に「続行することで利用規約とプライバシーポリシーに同意したものとみなされます。」という文言のみあり、リンク先・実体なし |
| プライバシーポリシー  | 同上、存在しない                                                                                                                                          |
| 通報 / モデレーション | DB テーブル・API・UI いずれも無し（`grep` で該当ゼロを確認済み）                                                                                          |
| 管理者ロール          | `Users` テーブル（`schema.ts:18-25`）に権限カラム無し。`middleware/auth.ts` にも admin 系ミドルウェア無し                                                 |
| 曲の非公開化・削除    | 所有者本人のみ可能（`song.service.ts` の `updateSongVisibility`/`deleteSong` は `eq(songs.userId, userId)` 必須）。運営者による強制操作の経路が無い       |
| メール送信基盤        | 未導入（`resend`/`sendgrid`/`nodemailer` 等いずれも依存関係に無し）                                                                                       |
| 公開曲の判定          | `songs.visibility === 'public'`（`Visibility.Public`、`types/index.ts`）。`song.service.ts` の `listSongs`/`searchSongs`/`getSongById` が参照             |
| 関連ロードマップ項目  | `feature-roadmap.md` E5「通報・モデレーション」（114 行目）が M3 に存在するが未着手                                                                       |

---

## 設計

### Part A: 利用規約

現状ページ自体が存在しないため、まず器を作る必要がある。

**実装方針**

- `apps/frontend/src/app/legal/terms/page.tsx` を新設（静的ページ）
- `AuthForm.tsx:86` のプレーンテキストを `/legal/terms` へのリンクに変更
- プライバシーポリシーは本計画のスコープ外だが、リンク切れを避けるため `apps/frontend/src/app/legal/privacy/page.tsx` に最小限の雛形（後日加筆）だけ用意する

**投稿コンテンツ条項ドラフト（要弁護士レビュー）**

> 以下はたたき台であり、そのまま公開せず弁護士等の専門家レビューを経ることを推奨する。

```
第◯条(投稿コンテンツの権利と責任)

1. 利用者は、本サービスに投稿するコード譜・歌詞その他のコンテンツ(以下「投稿コンテンツ」)について、
   自らが著作権等の必要な権利を有していること、または権利者から必要な許諾を得ていることを保証するものとします。

2. 利用者は、公開範囲を「URL限定公開」「特定ユーザー」「全体公開」に設定して投稿コンテンツを第三者が
   閲覧できる状態にする場合、当該投稿コンテンツが第三者の著作権その他の権利を侵害しないことについて、
   特に注意を払うものとします。他者が権利を有する歌詞全文を無許諾で転載し、これを第三者に公開する行為を禁止します。

3. 運営者は、投稿コンテンツが前項に違反する、または違反するおそれがあると判断した場合、利用者への
   事前の通知なく、当該投稿コンテンツの公開範囲を変更し、または全部若しくは一部を削除することができるものとします。

4. 運営者は、権利者その他の第三者から投稿コンテンツに関する削除要請等の申立てを受けた場合、その内容を
   精査の上、必要と判断したときは前項の措置を講じることができるものとします。

5. 投稿コンテンツに起因して第三者との間で紛争が生じた場合、利用者は自己の責任と費用によりこれを解決する
   ものとし、運営者は一切の責任を負わないものとします。ただし、運営者の故意または重過失による場合は
   この限りではありません。
```

私的利用（非公開保存）まで一律禁止すると本来合法な用途（自分用の練習譜面に実歌詞をメモする等）を妨げてしまうため、**「第三者に公開する行為」に絞って禁止する**設計にしている点がポイント。

---

### Part B: 通報機能

#### データモデル（`apps/backend/src/db/schema.ts` に追加）

```ts
export const reportReasonEnum = pgEnum("report_reason", [
  "copyright",
  "inappropriate",
  "other",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "resolved",
]);

export const songReports = pgTable(
  "SongReports",
  {
    id: uuid("Id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    songId: uuid("SongId")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    // 権利者・第三者は会員でないことが多いため任意項目とし、匿名通報を許可する
    reporterId: text("ReporterId").references(() => users.id, {
      onDelete: "set null",
    }),
    reporterEmail: text("ReporterEmail"),
    reason: reportReasonEnum("Reason").notNull(),
    comment: text("Comment"),
    status: reportStatusEnum("Status").notNull().default("pending"),
    createdAt: timestamp("CreatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("ReviewedAt", { withTimezone: true }),
  },
  (table) => [
    index("IX_SongReports_SongId").on(table.songId),
    index("IX_SongReports_Status").on(table.status),
  ],
);
```

`reason` に `copyright` を第一級の値として持たせ、著作権侵害の申立てを他の通報（不適切なコンテンツ等）と区別して優先処理できるようにする。

#### API 設計（`apps/backend/src/routes/`）

| メソッド | パス                     | 認証                 | 説明                                                                |
| -------- | ------------------------ | -------------------- | ------------------------------------------------------------------- |
| POST     | `/api/songs/:id/report`  | オプション（匿名可） | 通報作成。対象曲が `visibility: public` でない場合は 404            |
| GET      | `/api/admin/reports`     | 必須 ＋ 管理者       | 通報一覧（`status` でフィルタ可能）                                 |
| PATCH    | `/api/admin/reports/:id` | 必須 ＋ 管理者       | ステータス更新（`reviewed`/`resolved`）、任意で対象曲を強制非公開化 |

- 匿名通報を許可するが、フォローアップ用に `reporterEmail` を推奨入力とする
- 重複通報対策（v1）: 同一 `songId` + 同一 `reporterId`（または `reporterEmail`）で `status: pending` の通報が既にある場合は新規作成せず既存レコードを返す。IP ベースのレート制限は本計画のスコープ外（濫用が実際に問題化した場合に追加検討）
- 通報を受けても**自動非公開化はしない**（誤通報・嫌がらせ目的の濫用によって正当な公開曲が意図せず消えるのを防ぐため）。非公開化は管理者の手動判断を必須とする

#### 管理者判定

現状 `Users` にロール概念が無く、DB マイグレーションを増やすほどの規模でもないため、v1 は環境変数によるアローリストを採用する（`ALLOWED_ORIGINS` と同様の運用パターン）。

```ts
// apps/backend/src/middleware/admin.ts (新規)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const adminMiddleware = () =>
  createMiddleware(async (c, next) => {
    const email = c.get("email");
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  });
```

`authMiddleware()` の後段に連結して使用する。運営体制が拡大し複数管理者・権限段階が必要になった時点で `Users.role` カラムへの移行を検討する（本計画では不要と判断）。

#### フロントエンド

- `apps/frontend/src/app/songs/[id]/SongDetailContent.tsx`: `visibility === 'public'` の曲に「報告する」導線を追加。クリックで理由選択（著作権侵害 / 不適切なコンテンツ / その他）＋コメント欄＋（未ログイン時）連絡先メールのモーダルを表示し、`POST /api/songs/:id/report` を呼ぶ
- 送信後は「ご報告ありがとうございます。内容を確認します。」等のフィードバック表示のみ（結果の可視化はしない＝通報数の悪用防止）
- `apps/frontend/src/app/admin/reports/page.tsx`（新規）: 通報一覧・理由・コメント・対象曲へのリンクを表示し、「非公開にする」「対応済みにする」を操作できる最小限の管理画面
- `apps/frontend/src/middleware.ts` の `isProtectedRoute` に `/admin(.*)` を追加（バックエンド側の `adminMiddleware` が最終防衛線、フロントは早期リダイレクトのみ）

#### 通報後の運用フロー（v1）

1. 通報受付 → `status: pending` で保存
2. 管理者が `/admin/reports` を定期的に確認（メール通知は本計画スコープ外）
3. 著作権侵害が濃厚と判断した場合、管理画面から対象曲を強制非公開化（`visibility → private`。**削除ではなく非公開化を既定**とし、誤判定時に復元可能な状態を保つ。完全削除が必要な場合は運営者が個別に対応）
4. `status: resolved` に更新

---

## 要決定事項

実装着手前にプロダクトオーナー（ユーザー）側で決めておきたい点。

- [ ] 利用規約ドラフトの弁護士レビューを実施するか、まずはドラフトのまま公開して後日差し替えるか
- [ ] 匿名通報を許可する方針（本計画の推奨）でよいか、ログイン必須にして濫用対策を優先するか
- [ ] 管理者判定を環境変数アローリスト（本計画の推奨）で進めるか、最初から `Users.role` カラムにするか
- [ ] プライバシーポリシーの本文整備を同時並行で進めるか、別タスクとして切り出すか

---

## フェーズ別タスクチェックリスト

### Phase 1: 利用規約

- [ ] 投稿コンテンツ条項の最終文言確定（弁護士レビューの要否を含めて要決定事項を先に解消）
- [ ] `apps/frontend/src/app/legal/terms/page.tsx` 実装
- [ ] `apps/frontend/src/app/legal/privacy/page.tsx` 雛形実装（本文は別タスク）
- [ ] `AuthForm.tsx:86` のテキストを `/legal/terms` へのリンクに変更

### Phase 2: 通報機能・バックエンド

- [ ] `schema.ts` に `songReports` テーブル ＋ `reportReasonEnum`/`reportStatusEnum` 追加
- [ ] `pnpm db:generate` でマイグレーション生成 ＋ `pnpm db:push` でローカル検証
- [ ] `services/report.service.ts` 実装（作成・重複チェック・一覧・ステータス更新・対象曲の強制非公開化）
- [ ] `middleware/admin.ts` 実装（`ADMIN_EMAILS` 環境変数アローリスト）
- [ ] `routes/songs.ts` に `POST /:id/report` 追加（`optionalAuthMiddleware`、対象曲が `public` であることを検証）
- [ ] `routes/admin.ts`（新規）に `GET /reports` / `PATCH /reports/:id` 追加

### Phase 3: 通報機能・フロントエンド

- [ ] `SongDetailContent.tsx` に通報導線 ＋ モーダル追加
- [ ] `/admin/reports` 管理画面実装
- [ ] `middleware.ts` の `isProtectedRoute` に `/admin(.*)` 追加

### Phase 4: ドキュメント反映

- [ ] `docs/database/tables.md` に `SongReports` テーブル定義を追記
- [ ] `docs/api/endpoints.md` に新規エンドポイントを追記
- [ ] `docs/plans/feature-roadmap.md` の E5 行・M3 チェックリストから本計画書へのリンクを追加

---

## 関連ドキュメント

- [機能拡充ロードマップ](./feature-roadmap.md) — E5（通報・モデレーション）の元項目
- [テーブル定義](../database/tables.md) — 実装時に `SongReports` を追記
- [API エンドポイント](../api/endpoints.md) — 実装時に通報系エンドポイントを追記
- [データベースアーキテクチャ](../architecture/backend.md)
