# データベース設計

ChordBook のデータベース設計を説明します。

## ER図

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Users                                  │
├─────────────────────────────────────────────────────────────────────┤
│ PK │ Id          : TEXT                                             │
│    │ Email       : VARCHAR       NOT NULL                           │
│    │ DisplayName : VARCHAR       NULL                               │
│    │ AvatarUrl   : VARCHAR       NULL                               │
│    │ CreatedAt   : TIMESTAMP     NOT NULL                           │
│    │ UpdatedAt   : TIMESTAMP     NOT NULL                           │
└────┴────────────────────────────────────────────────────────────────┘
                    │
                    │ 1
                    │
                    ▼ *
┌─────────────────────────────────────────────────────────────────────┐
│                              Songs                                  │
├─────────────────────────────────────────────────────────────────────┤
│ PK │ Id            : UUID                                           │
│ FK │ UserId        : TEXT         NOT NULL  → Users.Id              │
│    │ Title         : VARCHAR      NOT NULL                          │
│    │ Artist        : VARCHAR      NULL                              │
│    │ Key           : VARCHAR      NULL                              │
│    │ Bpm           : INT          NULL                              │
│    │ TimeSignature : VARCHAR      NOT NULL  DEFAULT '4/4'           │
│    │ Content       : JSONB        NOT NULL  DEFAULT '[]'            │
│    │ Visibility    : INT          NOT NULL  DEFAULT 0 (Private)     │
│    │ CreatedAt     : TIMESTAMP    NOT NULL                          │
│    │ UpdatedAt     : TIMESTAMP    NOT NULL                          │
└────┴────────────────────────────────────────────────────────────────┘
                    │                             │
                    │ 1                           │ 1
                    │                             │
                    ▼ *                           ▼ *
┌────────────────────────────────┐   ┌────────────────────────────────┐
│           Bookmarks            │   │          SongShares            │
├────────────────────────────────┤   ├────────────────────────────────┤
│ PK │ Id        : UUID          │   │ PK │ Id         : UUID         │
│ FK │ UserId    : TEXT → Users  │   │ FK │ SongId     : UUID → Songs │
│ FK │ SongId    : UUID → Songs  │   │    │ ShareToken : VARCHAR      │
│    │ CreatedAt : TIMESTAMP     │   │    │ ExpiresAt  : TIMESTAMP    │
│    │ UpdatedAt : TIMESTAMP     │   │    │ CreatedAt  : TIMESTAMP    │
└────┴───────────────────────────┘   │    │ UpdatedAt  : TIMESTAMP    │
                                     └────┴───────────────────────────┘
```

## リレーションシップ

| 関係 | 説明 |
|------|------|
| Users → Songs | 1対多: 1人のユーザーは複数の曲を所有できる |
| Users → Bookmarks | 1対多: 1人のユーザーは複数のブックマークを持てる |
| Songs → Bookmarks | 1対多: 1曲は複数のユーザーにブックマークされる |
| Songs → SongShares | 1対多: 1曲は複数の共有リンクを持てる |

## テーブル定義詳細

### Users

ユーザー情報を管理するテーブル。Clerk と連携。

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| Id | TEXT | NO | - | 主キー（Clerk ユーザー ID） |
| Email | VARCHAR(255) | NO | - | メールアドレス（ユニーク） |
| DisplayName | VARCHAR(100) | YES | NULL | 表示名 |
| AvatarUrl | VARCHAR(500) | YES | NULL | アバター画像URL |
| CreatedAt | TIMESTAMP | NO | now() | 作成日時 |
| UpdatedAt | TIMESTAMP | NO | now() | 更新日時 |

### Songs

コード譜の楽曲情報を管理するテーブル。

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| Id | UUID | NO | newguid() | 主キー |
| UserId | TEXT | NO | - | 所有者（FK → Users） |
| Title | VARCHAR(200) | NO | - | 曲名 |
| Artist | VARCHAR(200) | YES | NULL | アーティスト名 |
| Key | VARCHAR(10) | YES | NULL | キー（C, Am, etc.） |
| Bpm | INT | YES | NULL | テンポ |
| TimeSignature | VARCHAR(10) | NO | '4/4' | 拍子 |
| Content | JSONB | NO | '[]' | コード譜データ（JSON） |
| Visibility | INT | NO | 0 | 公開設定（後述） |
| CreatedAt | TIMESTAMP | NO | now() | 作成日時 |
| UpdatedAt | TIMESTAMP | NO | now() | 更新日時 |

### Bookmarks

ユーザーのブックマーク（お気に入り）を管理するテーブル。

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| Id | UUID | NO | newguid() | 主キー |
| UserId | TEXT | NO | - | ユーザー（FK → Users） |
| SongId | UUID | NO | - | 曲（FK → Songs） |
| CreatedAt | TIMESTAMP | NO | now() | 作成日時 |
| UpdatedAt | TIMESTAMP | NO | now() | 更新日時 |

**ユニーク制約**: (UserId, SongId)

### SongShares

曲の共有リンクを管理するテーブル。

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| Id | UUID | NO | newguid() | 主キー |
| SongId | UUID | NO | - | 曲（FK → Songs） |
| ShareToken | VARCHAR(50) | NO | - | 共有用トークン（ユニーク） |
| ExpiresAt | TIMESTAMP | YES | NULL | 有効期限（NULL=無期限） |
| CreatedAt | TIMESTAMP | NO | now() | 作成日時 |
| UpdatedAt | TIMESTAMP | NO | now() | 更新日時 |

## 列挙型

### Visibility（公開設定）

| 値 | 名前 | 説明 |
|----|------|------|
| 0 | Private | 非公開（作成者のみ） |
| 1 | UrlOnly | URLを知っている人のみ |
| 2 | SpecificUsers | 特定ユーザーのみ |
| 3 | Public | 全員に公開 |

## Content カラムの JSON 構造

Songs.Content には以下の形式でコード譜データが格納されます。

```json
[
  {
    "id": "section-1",
    "name": "イントロ",
    "type": "bar",
    "lines": [
      { "bars": ["C", "G", "Am", "F"] }
    ]
  },
  {
    "id": "section-2",
    "name": "Aメロ",
    "type": "lyrics-chord",
    "lines": [
      {
        "lyrics": "歌詞がここに入ります",
        "chords": [
          { "chord": "C", "position": 0 },
          { "chord": "G", "position": 5 }
        ]
      }
    ]
  }
]
```

## インデックス

| テーブル | カラム | 種類 | 説明 |
|----------|--------|------|------|
| Users | Email | UNIQUE | メールアドレス検索 |
| Songs | UserId | INDEX | ユーザーの曲一覧取得 |
| Songs | Visibility | INDEX | 公開曲の検索 |
| Bookmarks | UserId | INDEX | ブックマーク一覧取得 |
| Bookmarks | (UserId, SongId) | UNIQUE | 重複防止 |
| SongShares | ShareToken | UNIQUE | トークンによる曲取得 |

## 関連ドキュメント

- [API仕様](../api/endpoints.md) - CRUD操作のAPI
- [バックエンドアーキテクチャ](../architecture/backend.md) - Entity Framework Core の設定
