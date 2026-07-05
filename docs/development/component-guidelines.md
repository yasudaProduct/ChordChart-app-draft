# コンポーネント実装ガイドライン

React のベストプラクティスに基づく、ChordBook フロントエンドのコンポーネント**実装規約（How）**。「何をどう書くか」の判断基準と Do/Don't を定める。

- **設計方針（What・構造・分類）**: [コンポーネント設計方針](../architecture/component-design.md)
- **全般規約（命名・インポート順）**: [コーディング規約](./coding-standards.md)
- **テスト**: [テスト](./testing.md)

> コード例の «Good» は本リポジトリの既存実装、«Bad» は改善対象の実パターンを示す（[リファクタリング計画](../plans/frontend-component-guidelines-and-refactoring.md) と対応）。

---

## 1. コンポーネントの種類とレイヤ

3 つのレイヤで捉える。**厳密な Container / Presentational 二分法は採らない**。代わりに「**データ取得・副作用はカスタムフックまたは Server Component へ寄せ、コンポーネント本体は UI と UI ロジックに集中する**」を原則とする。

| レイヤ                 | ディレクトリ                                    | 責務                       | ロジック                                                                           |
| ---------------------- | ----------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| **UI プリミティブ**    | `components/ui/`                                | 汎用・再利用可能な最小 UI  | ビジネスロジック・データ取得を**一切持たない**（純粋・controlled）                 |
| **機能コンポーネント** | `components/{song,editor,profile,auth,layout}/` | ドメイン固有の UI          | UI ロジック可。データ取得は**カスタムフック経由でコロケーション可**                |
| **ページ**             | `app/**/page.tsx`                               | ルーティング単位・画面構成 | 可能な限り Server Component。データ取得を伴う部分は `*Content.tsx`（Client）へ分離 |

### コロケーション型コンポジションを推奨

親が全データを取得して props でばらまくより、**各機能コンポーネントが自前のフックでデータを取得**して並べる方が、prop drilling を避けられる。

```tsx
// «Good» app/profile/page.tsx — 各カードが自己完結、prop drilling ゼロ
<ProfileHeaderCard />   {/* 内部で useUser */}
<StatsGrid />           {/* 内部で useMySummary */}
<RecentSongs />         {/* 内部で useMyRecentSongs */}
```

---

## 2. Server / Client Component の使い分け

**デフォルトは Server Component**（`'use client'` を書かない）。以下のいずれかを使うときだけ Client にする。

- `useState` / `useReducer` などの状態
- `useEffect` などの副作用
- イベントハンドラ（`onClick` 等）を**自分で登録**する
- ブラウザ API（`window`・`localStorage`・`navigator`）
- Client 専用フック（`useRouter`・Zustand・SWR・Clerk の `useUser`/`useSignIn` 等）

### `'use client'` は末端に置く

ページ全体を Client にせず、インタラクティブな部分だけ Client コンポーネントへ切り出す。

```tsx
// «Good» app/songs/page.tsx はサーバー（metadata + レイアウト）
//        → データ取得は Client の SongListContent に委譲
export const metadata = { title: "楽曲一覧" };
export default function SongsPage() {
  return (
    <>
      <SiteHeader variant="app" />
      <SongListContent />
    </>
  );
}
```

| 判定                         | 例                                                                   |
| ---------------------------- | -------------------------------------------------------------------- |
| ✅ client 不要（controlled） | `ui/Button`・`ui/Input`・`ui/Select` — イベントを props で受けるだけ |
| ⚠️ client 付け忘れ           | `SongPreview`（`useMemo` を使うのにディレクティブ無し）→ 付与する    |
| ⚠️ 不要な client             | `AccountSettingsCard`（`Link` のみ）→ 外す                           |

---

## 3. Props 設計

命名規則の詳細は [component-design.md §6](../architecture/component-design.md) を参照。ここでは実装上の判断基準を示す。

- **`type XxxProps` に統一**（`interface` は Zustand ストア等の内部型のみ）
- HTML 要素をラップするプリミティブは **属性を透過**する

```tsx
// «Good» ui/Button.tsx — ネイティブ属性を継承し type="button" を既定化
type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

- コールバックは `onXxx`、真偽値は `is`/`has`
- **Props でのカスタマイズより合成（children）を優先**
- **Props 爆発を避ける**: コールバック Props が 10 個を超えたら設計を見直す

```
// «Bad» SectionEditor は 17 プロパティ・コールバック 13 個を受領（中継ハブ化）
//   → 各コンポーネントが useEditorStore をセレクタ購読して受領数を削減する（R1）
```

- 表示単位をテストしやすくしたい場合、データを **props で注入可能**にする設計も有効

```tsx
// «Good» SongDetailContent — 外部注入があれば使い、無ければ自前取得
const song = externalSong !== undefined ? externalSong : fetched;
```

---

## 4. 状態管理の使い分け

| 状態の種類             | 手段                     | 例                         |
| ---------------------- | ------------------------ | -------------------------- |
| ローカル UI 状態       | `useState`               | フォーム入力・開閉フラグ   |
| 横断的クライアント状態 | Zustand                  | `editorStore`・`authStore` |
| サーバーデータ         | SWR（`hooks/` のフック） | `useSong`・`useMe`         |

### Zustand は必ずセレクタで購読する

```tsx
// «Good» EditorContent — 必要な値だけをセレクタで購読
const song = useEditorStore((s) => s.song);
const isDirty = useEditorStore((s) => s.isDirty);

// «Bad» useEditorActions / useSectionDrag — セレクタ無しの全 store 購読
const { updateSong } = useEditorStore(); // store の“どの”変更でも再実行される
```

- 複数値は**個別セレクタ**で取り出す（または `shallow` 比較）
- **コールバック内でしか使わない値は購読しない**。`useEditorStore.getState()` で読む（再レンダリング削減）
- サーバーデータは SWR に任せ、Zustand に**二重保持しない**。SWR フックは認証準備が整うまで `null` キーで無効化する

```tsx
// «Good» useSong — authStore のゲートで未認証時の fetch を抑止
useSWR(isAuthReady ? `/songs/${id}` : null, fetcher);
```

---

## 5. 再レンダリング最適化

原則: **むやみにメモ化しない。ただしリスト描画・高頻度更新（ドラッグ等）では必須**。

### リストで描画する子は memo 化し、コールバックを安定化する

```tsx
// «Bad» EditorContent — map 内で毎レンダリング 13 個のインライン関数を生成
//   子（SectionEditor）が非 memo のため全セクションが連鎖再レンダリングされる
{song.sections.map((section, index) => (
  <SectionEditor
    onDelete={() => deleteSection(section.id)}          // 毎回新しい関数
    onNameChange={(name) => useEditorStore.getState()...} // 経路も不統一
    /* ...さらに 11 個... */
  />
))}
```

改善の方向（R1）:

1. `SectionEditor` 等リストの子を `React.memo` 化する
2. 各子が **`useEditorStore` をセレクタ購読**し、親からのコールバック受領を減らす（prop drilling 解消）
3. 残すコールバックは `useCallback` で安定化する（memo の効果を保つため参照を固定）

### レンダー中の重い計算は `useMemo`

```tsx
// «Good» SongPreview / PreviewPanel — パース結果をメモ化
const parsed = useMemo(() => parseSectionContent(song.content), [song.content]);

// «Bad» SectionEditor — 毎レンダリングで parseSectionContent を再実行（R3）
```

### その他

- **高頻度の一時値**（ドラッグ座標）は state 更新を最小化する。連続更新が全ツリー再描画を招く場合、更新範囲を絞るか ref / CSS 変数を検討（`useChordDrag` の pointermove ごとの store 更新が該当）
- **乱用注意**: 単純な primitive の計算に `useMemo`/`useCallback` は不要。メモ化自体のコストが上回る

---

## 6. アクセシビリティ

- **semantic HTML を優先**（`header`/`nav`/`main`/`section`/`h1`–`h6`/`button`）。クリック可能な `div` を避ける
- ボタンは `<button type="button">` を明示（`ui/Button` は既定化済み）
- フォームは label と input を関連付ける（`htmlFor`/`id` またはネスト）
- ナビのアクティブ状態は `aria-current` を付与

### モーダル / ダイアログ — `AuthModal` を基準実装とする

```tsx
// «Good» AuthModal — role/aria-modal/ESC/aria-label を実装
<div role="dialog" aria-modal="true" onClick={close}>
  <div onClick={(e) => e.stopPropagation()}>
    <button type="button" aria-label="閉じる">
      …
    </button>
    …
  </div>
</div>;
// ESC で閉じる
useEffect(() => {
  if (!isOpen) return;
  const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, [isOpen, close]);
```

**フォーカストラップ**（開いている間フォーカスをダイアログ内に留める）は共通フック `useFocusTrap` として抽出し、`AuthModal`・`ui/Dialog` に適用する（R4）。

### 状態別の必須 aria（現状の欠落＝要修正）

| UI         | 必須                                   | 現状                                |
| ---------- | -------------------------------------- | ----------------------------------- |
| トースト   | `role="status"` + `aria-live="polite"` | `ui/Toast` 欠落 → 追加（R4）        |
| エラー表示 | `role="alert"`                         | `AuthForm` 等 欠落 → 追加           |
| トグル     | `role="switch"` + `aria-checked`       | `ui/Toggle` 欠落 → 追加（R4）       |
| 検索入力   | label / `aria-label`                   | `SongSearchInput` 欠落 → 追加（R8） |

- 装飾目的の svg は `aria-hidden="true"`、意味を持つ画像は `alt` を付与

---

## 7. アンチパターン集

| アンチパターン                       | 対策                                      | 該当例                                            |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------------- |
| `.map` 内でインライン関数を乱発      | `useCallback` / 子の memo 化 / store 購読 | `EditorContent`                                   |
| セレクタ無しの Zustand 全 store 購読 | セレクタで購読                            | `useEditorActions`・`useSectionDrag`              |
| レンダー中の重い計算                 | `useMemo`                                 | `SectionEditor`                                   |
| 深い prop drilling（中継ハブ化）     | store 購読 / 合成 / context               | editor ツリー                                     |
| 巨大コンポーネント・フック           | 責務分割                                  | `EditorContent`(186行)・`useEditorActions`(325行) |
| 配列 index を key に使う             | 安定した `id` を使う                      | `StatsGrid`（静的 skeleton）                      |
| 不要 / 付け忘れの `'use client'`     | 必要な最小範囲に                          | `AccountSettingsCard`・`SongPreview`              |
| non-null assertion（`x!`）           | 型ガードで解消                            | `AuthForm`・`useChordDrag`                        |
| URL クエリの未エンコード             | `encodeURIComponent`                      | `useSongSearch`                                   |

---

## 8. ディレクトリ・コロケーション・命名

- ディレクトリ構成・命名規則は [component-design.md](../architecture/component-design.md) に従う
- **テストはコロケーション**する（[testing.md](./testing.md) 参照）

```
components/ui/
├── Button.tsx
└── Button.test.tsx      # 同じ階層に配置
hooks/
├── useSong.ts
└── useSong.test.ts
```

| 対象           | 命名                       | 例                    |
| -------------- | -------------------------- | --------------------- |
| コンポーネント | PascalCase                 | `SectionEditor.tsx`   |
| フック         | `use` + PascalCase         | `useEditorActions.ts` |
| Props 型       | コンポーネント名 + `Props` | `SectionEditorProps`  |
| テスト         | 対象名 + `.test`           | `Button.test.tsx`     |

---

## 関連ドキュメント

- [コンポーネント設計方針](../architecture/component-design.md)
- [コーディング規約](./coding-standards.md)
- [テスト](./testing.md)
- [規約策定 & リファクタリング計画](../plans/frontend-component-guidelines-and-refactoring.md)
