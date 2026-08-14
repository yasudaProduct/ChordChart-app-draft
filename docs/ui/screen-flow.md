# 画面遷移図

ChordBook アプリケーションの画面遷移フローを説明します。

---

## 全体遷移図

```mermaid
flowchart TB
    subgraph 公開画面
        Home[ホーム<br/>/]
        Login[ログイン<br/>/login]
        Register[新規登録<br/>/register]
        Search[検索<br/>/search]
        Share[共有楽曲表示<br/>/share/:token]
        Songs[楽曲一覧<br/>/songs]
        SongDetail[楽曲詳細<br/>/songs/:id]
    end

    subgraph 認証必須画面
        SongNew[楽曲新規作成<br/>/songs/new]
        Editor[エディタ<br/>/editor/:id]
        Profile[プロフィール<br/>/profile]
        Bookmarks[ブックマーク一覧]
    end

    Home --> Login
    Home --> Register
    Home --> Search
    Home --> Songs
    Login <--> Register
    Login -->|ログイン成功| Songs
    Register -->|登録成功| Songs

    Songs --> SongNew
    Songs --> SongDetail
    Songs --> Profile
    Songs --> Bookmarks

    SongNew -->|作成完了| Editor
    SongNew -->|キャンセル| Songs
    SongDetail -->|編集| Editor
    SongDetail -->|戻る| Songs

    Editor -->|ロゴクリック| Songs

    Search -->|楽曲選択| SongDetail
    Search -->|ブックマーク時| Songs

    Share -->|ログインして編集| Login
```

### 外部共有フロー

```mermaid
flowchart TB
    ExtUser((外部ユーザー))
    Share[共有楽曲表示<br/>/share/:token]
    Login[ログイン<br/>/login]
    SongDetail[楽曲詳細<br/>/songs/:id]
    PDF[PDF出力]

    ExtUser -->|共有リンク| Share
    Share -->|印刷/PDF| PDF
    Share -->|ログインして編集| Login
    Login -->|ログイン成功| SongDetail
```

---

## 認証フロー

```mermaid
flowchart TB
    subgraph 未認証状態
        Home1[ホーム]
        Login1[ログイン]
        Register1[新規登録]
        Search1[検索]
        Share1[共有楽曲表示]
        Songs1[楽曲一覧<br/>※公開楽曲の閲覧のみ]
        SongDetail1[楽曲詳細<br/>※公開楽曲の閲覧のみ]
    end

    subgraph 認証済み状態
        AllPages[全画面アクセス可能<br/>・楽曲一覧（自分の楽曲も表示）<br/>・楽曲詳細<br/>・楽曲新規作成<br/>・エディタ<br/>・検索<br/>・プロフィール<br/>・共有楽曲表示]
    end

    Home1 --> Login1
    Home1 --> Search1
    Home1 --> Songs1
    Songs1 --> SongDetail1
    Login1 <--> Register1
    Login1 -->|認証成功| AllPages
    Register1 -->|登録成功| AllPages
    Search1 -->|閲覧のみ| Share1
    AllPages -->|ログアウト| Home1
```

---

## 楽曲管理フロー

### 新規作成フロー

```mermaid
flowchart LR
    Songs[楽曲一覧<br/>/songs]
    SongNew[楽曲新規作成<br/>/songs/new]
    Editor[エディタ<br/>/editor/:id]

    Songs -->|+ 新規作成| SongNew
    SongNew -->|エディタを開く| Editor
    SongNew -->|キャンセル| Songs
    Editor -->|ロゴクリック| Songs
```

**詳細ステップ**

1. 楽曲一覧で「+ 新規作成」をクリック
2. 楽曲新規作成画面でメタ情報を入力
   - 曲名（必須）
   - アーティスト
   - キー
   - BPM
   - 拍子
3. 「エディタを開く」をクリック
4. 楽曲が作成され、エディタ画面へ遷移
5. セクション・コードを編集
6. 自動保存 or Ctrl+S で保存

### 編集フロー

```mermaid
flowchart LR
    Songs[楽曲一覧<br/>/songs]
    SongDetail[楽曲詳細<br/>/songs/:id]
    Editor[エディタ<br/>/editor/:id]

    Songs -->|楽曲カード| SongDetail
    SongDetail -->|編集ボタン| Editor
    SongDetail -->|戻る| Songs
    Editor -->|ロゴクリック| Songs
```

**詳細ステップ**

1. 楽曲一覧で楽曲カードをクリック
2. 楽曲詳細画面でコード譜を確認
3. 「編集」ボタンをクリック
4. エディタ画面でセクション・コードを編集
5. 自動保存 or Ctrl+S で保存
6. ロゴクリックで楽曲一覧に戻る

---

## 共有フロー

### 共有リンク生成

```mermaid
flowchart TB
    SongDetail[楽曲詳細<br/>/songs/:id]
    Modal[共有設定モーダル]

    SongDetail -->|共有ボタン| Modal

    subgraph Modal[共有設定モーダル]
        Setting[公開設定<br/>・非公開<br/>・URL共有<br/>・公開]
        Link[共有リンク生成<br/>https://chord-books.com/share/xyz123]
        Expiry[有効期限設定]
    end
```

**共有設定オプション**

| 設定 | 説明 |
|------|------|
| 非公開 | 自分のみ閲覧可能 |
| URL共有 | リンクを知っている人が閲覧可能 |
| 公開 | 全ユーザーが検索・閲覧可能 |

### 共有リンクからのアクセス

```mermaid
flowchart TB
    ExtUser((外部ユーザー))
    Share[共有楽曲表示<br/>/share/:token]
    PDF[PDF出力]
    Login[ログイン<br/>/login]
    SongDetail[楽曲詳細<br/>/songs/:id]

    ExtUser -->|共有リンククリック| Share
    Share -->|印刷/PDF| PDF
    Share -->|ログインして編集| Login
    Login -->|ログイン成功| SongDetail

    Note1[※ブックマークに追加される]
    SongDetail --- Note1
```

---

## 検索・ブックマークフロー

```mermaid
flowchart LR
    Search[検索<br/>/search]
    SongDetail[楽曲詳細<br/>/songs/:id]
    Bookmark[ブックマークに追加]
    BookmarkList[ブックマーク一覧]

    Search -->|楽曲選択| SongDetail
    SongDetail -->|ブックマークボタン| Bookmark
    Bookmark --> BookmarkList
```

**詳細ステップ**

1. 検索画面でキーワードを入力
2. 検索結果から楽曲を選択
3. 楽曲詳細画面でコード譜を確認
4. 「ブックマーク」ボタンをクリック
5. マイブックマーク一覧に追加

---

## エディタ内部フロー

### セクション操作フロー

```mermaid
flowchart TB
    Section[セクション]

    Section --> Drag[ドラッグ並び替え]
    Section --> Format[形式切替]
    Section --> Copy[複製]
    Section --> Delete[削除]
    Section --> Collapse[折りたたみ]

    Drag --> ReorderResult[セクション順序変更]
    Format --> FormatResult[歌詞+コード ⇔ 小節形式]
    Copy --> CopyResult[新しいセクションを挿入]
    Delete --> DeleteResult[セクションを削除]
    Collapse --> CollapseResult[セクションを最小化]
```

### コード入力フロー

```mermaid
flowchart TB
    Start[コードレーンをクリック]
    Input[コード入力開始]
    Suggest[補完候補表示]
    Select[候補を選択<br/>クリック/Enter]
    Cancel[入力キャンセル]
    Confirm[コード確定]
    Next[次の入力位置へ]

    Start --> Input
    Input -->|文字入力| Suggest
    Suggest -->|候補選択| Select
    Suggest -->|Escape| Cancel
    Select --> Confirm
    Confirm -->|Tab キー| Next
    Next --> Input
```

---

## 状態遷移（保存状態）

```mermaid
stateDiagram-v2
    [*] --> 保存済み

    保存済み --> 編集中: 編集操作
    編集中 --> 保存中: 2秒間操作なし / Ctrl+S
    保存中 --> 保存済み: 保存成功
    保存中 --> 編集中: 保存中に編集
    保存中 --> エラー: 保存失敗
    エラー --> 編集中: 再試行
```

### 保存状態の説明

| 状態 | 表示 | 説明 |
|------|------|------|
| 保存済み | 「保存済み」| 変更がすべて保存されている |
| 編集中 | 「未保存の変更あり」| isDirty = true |
| 保存中 | 「保存中...」| API通信中 |
| エラー | エラーメッセージ | 保存に失敗、再試行可能 |

---

## ページアクセス権限マトリクス

| 画面 | 未認証 | 認証済み | 所有者 | 備考 |
|------|--------|---------|-------|------|
| ホーム `/` | ○ | ○ | - | ログイン済みはリダイレクト可 |
| ログイン `/login` | ○ | × | - | 認証済みは楽曲一覧へリダイレクト |
| 新規登録 `/register` | ○ | × | - | 認証済みは楽曲一覧へリダイレクト |
| 楽曲一覧 `/songs` | ○ | ○ | - | 未認証は公開楽曲のみ表示 |
| 楽曲詳細 `/songs/:id` | △ | ○ | ○ | 公開楽曲のみ未認証でも閲覧可 |
| 楽曲新規作成 `/songs/new` | × | ○ | - | 要認証 |
| エディタ `/editor/:id` | × | △ | ○ | 所有者のみ編集可 |
| 検索 `/search` | ○ | ○ | - | 公開楽曲の検索 |
| プロフィール `/profile` | × | ○ | - | 要認証 |
| 共有楽曲表示 `/share/:token` | ○ | ○ | - | 有効な共有リンクで閲覧可 |

**凡例**: ○ = アクセス可、× = アクセス不可（リダイレクト）、△ = 条件付き

---

## リダイレクトルール

```mermaid
flowchart LR
    subgraph リダイレクト条件
        A[未認証で認証必須ページ]
        B[認証済みでログイン画面]
        C[存在しない楽曲ID]
        D[無効な共有トークン]
        E[ログアウト実行]
    end

    A -->|リダイレクト| Login["/login?redirect=元のURL"]
    B -->|リダイレクト| Songs[/songs]
    C -->|リダイレクト + エラー| Songs2[/songs]
    D -->|リダイレクト + エラー| Home[/]
    E -->|リダイレクト| Home2[/]
```

| 条件 | 遷移元 | 遷移先 |
|------|--------|--------|
| 未認証で認証必須ページにアクセス | `/songs/new`, `/editor/:id`, `/profile` | `/login?redirect=元のURL` |
| 認証済みでログイン/登録画面にアクセス | `/login`, `/register` | `/songs` |
| 存在しない楽曲IDにアクセス | `/songs/:id`, `/editor/:id` | `/songs` + エラー表示 |
| 無効な共有トークン | `/share/:token` | `/` + エラー表示 |
| ログアウト実行 | 任意 | `/` |

---

## 関連ドキュメント

- [画面一覧](./screens.md) - 各画面の詳細仕様
- [機能一覧](../features/overview.md) - 機能詳細
- [フロントエンド設計](../architecture/frontend.md) - 技術実装
