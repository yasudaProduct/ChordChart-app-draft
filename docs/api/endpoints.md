# API エンドポイント

ChordBook バックエンド API のエンドポイント一覧です。

## 基本情報

| 項目              | 値                                    |
| ----------------- | ------------------------------------- |
| ベースURL（開発） | http://localhost:8080/api             |
| ベースURL（本番） | https://api.chordbook.example.com/api |
| 形式              | REST API                              |
| データ形式        | JSON                                  |
| 認証              | Clerk JWT                             |

## エンドポイント一覧

| メソッド | パス                | 認証             | 説明                          |
| -------- | ------------------- | ---------------- | ----------------------------- |
| GET      | /api/health         | 不要             | ヘルスチェック                |
| GET      | /api/songs          | オプション       | 曲一覧取得                    |
| GET      | /api/songs/demo     | 不要             | デモ用曲一覧取得              |
| GET      | /api/songs/search   | オプション       | 公開曲検索                    |
| GET      | /api/songs/:id      | オプション       | 曲詳細取得                    |
| POST     | /api/songs          | 必須             | 曲作成                        |
| PUT      | /api/songs/:id      | 必須             | 曲更新                        |
| DELETE   | /api/songs/:id      | 必須             | 曲削除                        |
| POST     | /api/webhooks/clerk | 不要（署名検証） | Clerk Webhook（ユーザー同期） |

---

### Health Check

#### GET /api/health

サーバーの稼働状態を確認します。

**認証**: 不要

**レスポンス**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Songs（楽曲）

#### GET /api/songs

楽曲一覧を取得します。

**認証**: オプション

- 認証あり: 自分の曲一覧を返却
- 認証なし: 公開曲（visibility = 3）のみ返却

**レスポンス**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "サンプル曲",
    "artist": "サンプルアーティスト",
    "key": "C",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### GET /api/songs/demo

デモ用の楽曲一覧を取得します。`isDemo = true` の曲のみを更新日時の降順で返却します。ログイン前に機能を試すためのエンドポイントで、認証は不要です。

**認証**: 不要

**レスポンス**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Demo Song - Acoustic Ballad",
    "artist": "ChordBook",
    "key": "C",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### GET /api/songs/search

公開曲を検索します。

**認証**: オプション

**クエリパラメータ**

| パラメータ | 型     | 必須 | 説明                                                     |
| ---------- | ------ | ---- | -------------------------------------------------------- |
| q          | string | Yes  | 検索キーワード（タイトル・アーティスト・キーで部分一致） |

**レスポンス**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "サンプル曲",
    "artist": "サンプルアーティスト",
    "key": "C",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### GET /api/songs/:id

指定した楽曲の詳細を取得します。

**認証**: オプション

- 認証あり: 自分の曲、公開曲、URL限定公開曲にアクセス可能
- 認証なし: 公開曲のみ

**パスパラメータ**

| 名前 | 型   | 説明   |
| ---- | ---- | ------ |
| id   | UUID | 楽曲ID |

**レスポンス**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "サンプル曲",
  "artist": "サンプルアーティスト",
  "key": "C",
  "bpm": 120,
  "timeSignature": "4/4",
  "content": {
    "sections": [
      {
        "id": "section-1",
        "name": "イントロ",
        "type": "chord-only",
        "content": "{\"lines\":[{\"id\":\"line-1\",\"lyrics\":\"\",\"chords\":[{\"id\":\"chord-1\",\"chord\":\"C\",\"offset\":0.2},{\"id\":\"chord-2\",\"chord\":\"G\",\"offset\":0.4}]}]}"
      }
    ]
  },
  "visibility": 0,
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**エラーレスポンス**

| ステータス | 説明               |
| ---------- | ------------------ |
| 404        | 楽曲が見つからない |

---

#### POST /api/songs

新しい楽曲を作成します。

**認証**: 必須

**リクエストボディ**

```json
{
  "title": "新しい曲",
  "artist": "アーティスト名",
  "key": "G",
  "bpm": 100,
  "timeSignature": "4/4"
}
```

| フィールド    | 型             | 必須 | 説明                      |
| ------------- | -------------- | ---- | ------------------------- |
| title         | string         | Yes  | 曲名（1文字以上）         |
| artist        | string \| null | No   | アーティスト名            |
| key           | string \| null | No   | キー（C, Am, etc.）       |
| bpm           | number \| null | No   | テンポ（整数）            |
| timeSignature | string         | No   | 拍子（デフォルト: "4/4"） |

**レスポンス**: 201 Created

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "新しい曲",
  "artist": "アーティスト名",
  "key": "G",
  "bpm": 100,
  "timeSignature": "4/4",
  "content": "{\"sections\":[]}",
  "visibility": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

#### PUT /api/songs/:id

楽曲を更新します（所有者のみ）。

**認証**: 必須

**パスパラメータ**

| 名前 | 型   | 説明   |
| ---- | ---- | ------ |
| id   | UUID | 楽曲ID |

**リクエストボディ**

```json
{
  "title": "更新後の曲名",
  "artist": "更新後のアーティスト",
  "key": "Am",
  "bpm": 110,
  "timeSignature": "3/4",
  "content": "[{\"id\":\"section-1\",\"name\":\"Aメロ\",\"type\":\"lyrics-chord\",\"lines\":[]}]"
}
```

| フィールド    | 型             | 必須 | 説明                         |
| ------------- | -------------- | ---- | ---------------------------- |
| title         | string         | Yes  | 曲名（1文字以上）            |
| artist        | string \| null | No   | アーティスト名               |
| key           | string \| null | No   | キー                         |
| bpm           | number \| null | No   | テンポ（整数）               |
| timeSignature | string         | No   | 拍子                         |
| content       | string         | No   | コード譜データ（JSON文字列） |

**レスポンス**: 200 OK

**エラーレスポンス**

| ステータス | 説明                                 |
| ---------- | ------------------------------------ |
| 404        | 楽曲が見つからない（または権限なし） |

---

#### DELETE /api/songs/:id

楽曲を削除します（所有者のみ）。

**認証**: 必須

**パスパラメータ**

| 名前 | 型   | 説明   |
| ---- | ---- | ------ |
| id   | UUID | 楽曲ID |

**レスポンス**: 204 No Content

**エラーレスポンス**

| ステータス | 説明                                 |
| ---------- | ------------------------------------ |
| 404        | 楽曲が見つからない（または権限なし） |

---

## 共通エラーレスポンス

### バリデーションエラー（400）

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["title"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### 認証エラー（401）

```json
{
  "error": "Unauthorized"
}
```

### HTTPステータスコード

| コード | 説明                         |
| ------ | ---------------------------- |
| 200    | 成功                         |
| 201    | 作成成功                     |
| 204    | 成功（レスポンスボディなし） |
| 400    | バリデーションエラー         |
| 401    | 認証エラー                   |
| 404    | リソースが見つからない       |
| 500    | サーバーエラー               |

## API テスト

VS Code の REST Client 拡張機能でテストできます。

```
apps/backend/.http/
├── auth.http     # 認証テスト
└── songs.http    # Song CRUD
```

## 関連ドキュメント

- [API概要](./overview.md) - 認証方式の詳細
- [データベース設計](../database/er-diagram.md) - データ構造
