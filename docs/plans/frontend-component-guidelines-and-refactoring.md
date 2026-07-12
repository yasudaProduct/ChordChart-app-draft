# フロントエンド コンポーネント規約策定 & リファクタリング計画

## 概要

ChordBook フロントエンド（Next.js 14 + React 18）のコンポーネントを **React のベストプラクティスに準拠**して作成・テストできるようにするための計画。

1. コンポーネント作成・コーディングの**規約を策定**する
2. **コンポーネントテスト基盤**（現状未導入）を整備する
3. 策定した規約に照らして**既存コンポーネントのリファクタリング箇所を洗い出し**、方針を立てる

本計画は「まず規約とテスト基盤という土台を固め、その上でリファクタリングを段階的に進める」方針で構成する。

---

## 1. 現状分析（コンポーネント全 28 個・フック 7 個の調査結果）

### 1.1 表層品質は良好（既に守られている点）

| 観点               | 状況                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| 型安全性           | `any` は **frontend 全体で 0 箇所**（`unknown` を適切に使用）                          |
| Props 型           | **全ファイルで `type XxxProps` に統一**（`interface` は Zustand ストア定義のみ）       |
| key                | 配列 index を key に使う箇所はほぼ無し（`StatsGrid` の静的 skeleton 1 箇所のみ）       |
| non-null assertion | `AuthForm`(`signIn!`) と `useChordDrag`(`null!`) の 2 箇所のみ                         |
| 命名・インポート順 | 概ね `coding-standards.md` に準拠                                                      |
| バンドル最適化     | `EditorContent` が `next/dynamic` で PreviewPanel/ChordDialog を遅延ロード（実践済み） |

### 1.2 模範として規約に取り込むべき「良い実装」

- **`ui/Button.tsx`** — `React.ButtonHTMLAttributes` 拡張・`type="button"` デフォルト・variant/size を module-level const 化
- **`editor/[id]/page.tsx` ↔ `EditorContent`** — 同一コンポーネントに `fetchSong`/`saveFn` を注入する**依存性注入（DI）パターン**で本番 API 版とデモ localStorage 版を再利用
- **`profile/page.tsx`** — 4 枚のカードを並置し、各カードが自前でデータ取得する**コロケーション型コンポジション**（prop drilling ゼロ）
- **`songs/[id]/page.tsx`** — サーバー page（metadata＋レイアウト）→ Client `*Content`（データ取得）の分離
- **`hooks/useSong.ts`** — SWR フックを authStore でゲートし null キーで無効化する規律的なデータ取得層

### 1.3 課題（カテゴリ別）

#### A. 再レンダリング最適化がほぼ皆無（優先度: 高）

- `React.memo` は **frontend 全体で 0 箇所**。`useMemo` は `SongPreview`/`PreviewPanel`/`SongListContent` の 3 箇所のみ
- `EditorContent` は `section.map` 内で**毎レンダリング 13 個のインライン矢印関数を生成** → 子（`SectionEditor` 他）が非 memo 化のため、1 文字入力やコードドラッグ（`useChordDrag` が pointermove ごとに store 更新）で**全セクションツリーが連鎖再レンダリング**
- `SectionEditor` は毎レンダリングで `parseSectionContent` を再実行、`ChordRow` はインライン style を毎回生成

#### B. prop drilling が editor 系で深刻（優先度: 高）

```
EditorContent ──(コールバック13個)──▶ SectionEditor ──(8個)──▶ SectionHeader
                                              └────(3個)──▶ LineEditor ──(2個)──▶ ChordRow
```

- Zustand ストアがあるのに editor 描画ツリーは props 依存。中間層（`SectionEditor`/`LineEditor`）が単なる中継ハブ化
- `EditorContent` 内で `onNameChange`/`onTypeChange` だけ props を使わず `useEditorStore.getState().updateSection()` を直接インライン呼び → **状態更新経路が不統一**

#### C. God Component / 肥大化フック（優先度: 高〜中）

- `EditorContent`（186 行）— データ取得・ルーティング・副作用・store 11 セレクタ購読・3 フック統括・UI 描画を全担
- `useEditorActions`（325 行）— API・クリップボード共有・座標計算・全 CRUD を凝集。`useEditorStore()` を**セレクタなし全購読**し、`EditorContent` と `useChordDrag` から**二重インスタンス化**（19 個の useCallback ×2）

#### D. Container / Presentational 未分離（優先度: 中）

- `search/page.tsx` — 自前デバウンス（useRef タイマー）＋状態＋データ取得＋描画を 1 ファイルに凝集
- `songs/new/page.tsx` — 5 個の useState ＋ API 呼び出し＋フォーム描画を 1 ファイルに凝集

#### E. アクセシビリティの不統一（優先度: 中）

| コンポーネント              | 欠落している対応                                                     |
| --------------------------- | -------------------------------------------------------------------- |
| `ui/Dialog`                 | `role="dialog"`・`aria-modal`・ESC・フォーカストラップすべて無し     |
| `ui/Toast`                  | `role="status"`・`aria-live` 無し（読み上げされない）                |
| `ui/Toggle`                 | `role="switch"`・`aria-checked` 無し                                 |
| `SongSearchInput`           | label・aria-label 無し（placeholder のみ）                           |
| `AuthForm` / エラー表示全般 | `role="alert"` / `aria-live` 無し                                    |
| `AuthModal`                 | フォーカストラップ無し（role/aria/ESC は実装済み・**基準にできる**） |

#### F. 細かな不整合（優先度: 低）

- `'use client'` 運用のブレ（`SongPreview` は `useMemo` 使用だがディレクティブ無し、`AccountSettingsCard` は Link のみで不要な `'use client'`）
- `SongCard` の遷移方法が不統一（Link / 生 button+router.push / Button コンポーネント混在）
- `useSongSearch` がクエリを未エンコードで URL に埋め込み（`?q=${query}`）
- `AuthProvider` の useEffect 依存配列に未使用の `setLoading`

### 1.4 既存ドキュメントの過不足

| ドキュメント                       | 現状評価                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `architecture/component-design.md` | 設計原則・ディレクトリ・分類・Props 設計は**充実**。ただし ①`type` 推奨と `coding-standards.md` の `interface` 使用が**矛盾** ②ディレクトリ構成が実態（auth/profile/providers 欠落）と乖離 ③**最適化・a11y・テスト観点が欠落** |
| `development/coding-standards.md`  | 全般規約。React 部分が薄く、`interface XxxProps` 例が実態（`type`）と矛盾                                                                                                                                                      |
| `development/testing.md`           | BE/E2E 中心。「**FE コンポーネント単体テストは現時点では未導入**」と明記され、基盤・方針とも未整備                                                                                                                             |

**テスト基盤の実態**: `package.json` に `test` スクリプトが**存在せず**（`e2e` のみ）、Vitest/Jest・Testing Library とも**未インストール**。

---

## 2. ドキュメント配置方針（検討結果）

「新規に作るか、既存に含めるか」を検討した結果を記す。

### 2.1 検討した選択肢

| 案                          | 内容                                                              | 評価                                                                                               |
| --------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| A: 既存拡張                 | `component-design.md` に実装規約もすべて追記＋`testing.md` に追記 | ✗ `component-design.md` が肥大化し、architecture（方針）と development（実装ルール）の境界が崩れる |
| B: 完全新規                 | 実装規約もテスト規約もすべて新規ファイル化                        | △ 役割は明確だが、充実している既存 `component-design.md` と重複が発生                              |
| **C: ハイブリッド（採用）** | 設計方針は既存を活かし、**実装の Do/Don't** を新規に切り出す      | ◎ 各ドキュメントの役割（What / How / Test）が明確                                                  |

### 2.2 採用案（案 C）— ドキュメント構成

| ドキュメント                          | 役割                                                           | 対応                                                                |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `architecture/component-design.md`    | **設計方針（What）**: 設計原則・レイヤ構造・分類・Props 設計   | 🔧 **更新**（実態反映＋新規 guidelines へ相互リンク）               |
| `development/component-guidelines.md` | **実装規約（How）**: React ベストプラクティスに基づく Do/Don't | ✨ **新規作成**（今回の中心成果物）                                 |
| `development/testing.md`              | **テスト規約**: FE コンポーネントテスト節を追加                | 🔧 **更新**（節追加）                                               |
| `development/coding-standards.md`     | 全般規約                                                       | 🔧 **軽微修正**（`interface`→`type` 矛盾解消・guidelines へリンク） |

---

## 3. Phase 1: コンポーネント規約の策定

### 3.1 `development/component-guidelines.md`（新規）— 目次案

React ベストプラクティス（Vercel 57 ルール）と本リポジトリの実態を踏まえた、実装時に参照する規約。

1. **コンポーネントの種類とレイヤ** — `ui/`（純粋プリミティブ）/ 機能コンポーネント / ページ（Server Component 優先）の 3 層。厳密な Container/Presentational 二分法ではなく「データ取得はカスタムフック or Server Component へ、UI ロジックはコンポーネントに」を原則とする
2. **Server / Client Component の使い分け** — `'use client'` は必要な最小範囲に。判断フロー（状態・イベント・ブラウザ API・フック使用時のみ client）
3. **Props 設計** — `type XxxProps` 統一（実態を正式規約化）、コールバックは `onXxx`、children/合成を優先、Props 爆発（10 個超）を避ける指針
4. **状態管理の使い分け** — ローカル `useState` / 横断 Zustand / サーバー SWR の判断基準。Zustand は**セレクタで購読**（全 store 購読禁止）
5. **再レンダリング最適化** — `React.memo` を適用する基準、`useCallback`/`useMemo` の適切な使いどころ（乱用も避ける）、リスト描画で子を memo 化＋コールバックを安定化する型
6. **アクセシビリティ** — semantic HTML、`button type`、label 関連付け、モーダルの role/aria-modal/ESC/フォーカストラップ、通知の aria-live。**`AuthModal` を基準実装**とする
7. **アンチパターン集** — map 内インライン関数の乱発、index-as-key、非セレクタ store 購読、レンダー中の重い計算、prop drilling の深いバケツリレー
8. **ディレクトリ・コロケーション・命名** — `component-design.md` を参照しつつ、テスト（`*.test.tsx`）の配置ルールを追加

### 3.2 `architecture/component-design.md`（更新）

- ディレクトリ構成を実態（`auth/`・`profile/`・`providers/`・`demo/`・`*Content.tsx`）に更新
- `type` vs `interface` を `type` に確定（`coding-standards.md` と整合）
- 「Container = page.tsx のみ」の記述を、DI パターン（`EditorContent`）やコロケーション（`profile`）を許容する現実的な表現へ修正
- 新規 `component-guidelines.md` / `testing.md`（FE 節）へ相互リンク

### 3.3 `development/coding-standards.md`（軽微修正）

- React コンポーネント例の `interface SongCardProps` を `type SongCardProps` に修正
- `component-guidelines.md` へのリンク追加

---

## 4. Phase 2: コンポーネントテスト基盤の導入

### 4.1 技術選定

| 項目                 | 選定                                                         | 理由                                                                  |
| -------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| テストランナー       | **Vitest**                                                   | バックエンドと統一（既に vitest 採用）、高速、TS ネイティブ           |
| DOM 環境             | **jsdom**                                                    | React Testing Library との互換性が高い（後で happy-dom へ切替可）     |
| コンポーネントテスト | **@testing-library/react** + **@testing-library/user-event** | 「実装でなく振る舞い」をテストする方針（`testing.md` 既存方針と一致） |
| マッチャ             | **@testing-library/jest-dom**                                | `toBeInTheDocument` 等                                                |
| React プラグイン     | **@vitejs/plugin-react**                                     | JSX 変換                                                              |

インストール（devDependencies）:

```
vitest jsdom @vitejs/plugin-react
@testing-library/react @testing-library/user-event @testing-library/jest-dom
```

### 4.2 セットアップ作業

- [ ] `apps/frontend/vitest.config.ts` を作成（environment: jsdom、`@` エイリアス解決、setup ファイル指定）
- [ ] `apps/frontend/vitest.setup.ts` を作成（`@testing-library/jest-dom` 読込、`next/navigation`・`@clerk/nextjs` のモック雛形）
- [ ] `package.json` に `"test": "vitest run"` / `"test:watch": "vitest"` を追加
- [ ] E2E（`playwright test`）と単体（`vitest`）のスクリプト名衝突を整理（`test` = 単体、`e2e` = Playwright）
- [ ] CI（`.github/workflows`）の frontend ジョブで `pnpm test` を有効化（`testing.md` に記載済みだが未稼働のジョブを実装）

### 4.3 テスト対象の優先順位

| 優先 | 対象                                                                | 狙い                                                                      |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1    | `ui/` プリミティブ（Button, Input, Select, Toggle, Dialog, Toast）  | テスト容易・規約の模範・a11y リグレッション防止                           |
| 2    | 表示系（SongCard, SongPreview, StatsGrid 等）                       | props → 描画の振る舞い固定                                                |
| 3    | **リファクタ対象の editor 系**（SectionEditor 等）                  | **リファクタ前に振る舞いを固定**（characterization test）してから memo 化 |
| 4    | ロジックを持つフック（useEditorActions, 抽出予定の useDebounce 等） | ロジックの単体テスト                                                      |

### 4.4 `development/testing.md`（更新）

- 「FE コンポーネント単体テストは未導入」の記述を削除し、Vitest + Testing Library 節を追加
- テストの書き方（AAA、role ベースクエリ、user-event）、モック方針、ファイル配置（コロケーション `Foo.test.tsx`）を記載

---

## 5. Phase 3: 規約に基づくリファクタリング洗い出しと方針

> **前提**: リファクタ対象は Phase 2 で**先にテストを書いて振る舞いを固定**してから着手する（デグレ防止）。

### 5.1 優先度: 高（React ベストプラクティスの核心・影響大）

| #      | 対象                                                                        | 課題                                                                                            | リファクタリング方針                                                                                                                                                                                                      |
| ------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | `EditorContent` + `SectionEditor` + `SectionHeader`/`LineEditor`/`ChordRow` | prop drilling 3〜4 段 ＋ memo 皆無 ＋ インライン関数 13 個 → ドラッグ時に全ツリー再レンダリング | ① 各 editor 子を `React.memo` 化 ② **中間層が props を中継せず、各コンポーネントが `useEditorStore` をセレクタ購読**して drilling を解消 ③ 残すコールバックは `useCallback` で安定化 ④ インライン `getState()` 呼びを統一 |
| **R2** | `useEditorActions`（325 行）                                                | 責務過多・非セレクタ全購読・二重インスタンス化                                                  | 責務分割（section / line / chord / share / meta）、`useEditorStore` をセレクタ購読、`EditorContent`・`useChordDrag` からの二重生成を解消                                                                                  |
| **R3** | `SectionEditor` / `ChordRow`                                                | 毎レンダリングで `parseSectionContent` 実行・インライン style 生成                              | `useMemo` 化・style オブジェクトのメモ化                                                                                                                                                                                  |

### 5.2 優先度: 中

| #      | 対象                                    | 課題                                            | 方針                                                                                     |
| ------ | --------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **R4** | `ui/Dialog`・`Toast`・`Toggle`          | a11y 欠落                                       | `AuthModal` を基準に role/aria/ESC を統一。`useFocusTrap`・`useEscapeKey` 共通フック抽出 |
| **R5** | `search/page.tsx`・`songs/new/page.tsx` | Container/Presentational 未分離・自前デバウンス | `useDebounce`・`useSongForm` 等カスタムフックへロジック抽出                              |
| **R6** | `SongCard`                              | 遷移方法が不統一（Link/button/Button 混在）     | ナビゲーションの実装を統一                                                               |
| **R7** | `coding-standards.md`                   | `interface` 表記が実態と矛盾                    | `type` に統一（Phase 1 で対応）                                                          |

### 5.3 優先度: 低

| #       | 対象                                 | 課題                                | 方針                           |
| ------- | ------------------------------------ | ----------------------------------- | ------------------------------ |
| **R8**  | `SongSearchInput`                    | label/aria-label 無し               | ラベル付与                     |
| **R9**  | `SongPreview`・`AccountSettingsCard` | `'use client'` の付け漏れ／不要付与 | 整理                           |
| **R10** | `AuthProvider`                       | useEffect 依存配列に未使用値        | 整理                           |
| **R11** | `useSongSearch`                      | クエリ未エンコード                  | `encodeURIComponent`           |
| **R12** | `AuthForm`・`useChordDrag`           | non-null assertion                  | 型ガードで解消（可能な範囲で） |

---

## 6. 実施ロードマップ

```
Phase 1  規約策定           ── component-guidelines.md 新規 + design/coding-standards 更新
   │                           （レビュー・合意ポイント）
Phase 2  テスト基盤導入      ── Vitest + Testing Library セットアップ + ui/ テスト + testing.md 更新
   │
Phase 3  リファクタ（高）    ── R1〜R3（対象を先にテストで固定 → memo化 / store購読化 / 責務分割）
   │
Phase 4  リファクタ（中・低）── R4〜R12（a11y統一・フック抽出・細部整理）
```

各 Phase 完了時に `pnpm lint` / `pnpm test` / `pnpm build` で回帰を確認する。

---

## 7. タスクチェックリスト

### Phase 1: 規約策定

- [ ] `development/component-guidelines.md` を新規作成（§3.1 の目次に沿って）
- [ ] `architecture/component-design.md` を更新（ディレクトリ実態反映・`type` 確定・相互リンク）
- [ ] `development/coding-standards.md` の `interface`→`type` 修正・リンク追加

### Phase 2: テスト基盤

- [ ] テスト関連 devDependencies をインストール
- [ ] `vitest.config.ts` / `vitest.setup.ts` 作成
- [ ] `package.json` に `test` / `test:watch` スクリプト追加
- [ ] `ui/` プリミティブのテストを作成（Button から）
- [ ] `development/testing.md` に FE コンポーネントテスト節を追加
- [ ] CI で `pnpm test`（FE）を有効化

### Phase 3: リファクタ（高）

- [ ] R1: editor ツリーの memo 化 ＋ store セレクタ購読化 ＋ prop drilling 解消
- [ ] R2: `useEditorActions` の責務分割・セレクタ化・二重生成解消
- [ ] R3: `SectionEditor`/`ChordRow` の計算・style メモ化

### Phase 4: リファクタ（中・低）

- [ ] R4: モーダル/トースト/トグルの a11y 統一（共通フック抽出）
- [ ] R5: `search`・`songs/new` のロジック抽出
- [ ] R6〜R12: ナビ統一・a11y・`'use client'` 整理・エンコード・non-null assertion 解消

---

## 8. 関連ドキュメント

- [コンポーネント設計方針](../architecture/component-design.md)
- [コーディング規約](../development/coding-standards.md)
- [テスト](../development/testing.md)
- [フロントエンドアーキテクチャ](../architecture/frontend.md)
