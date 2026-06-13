# テーブル定義

ChordBook データベースの各テーブル詳細定義です。

---

## Users テーブル

ユーザー情報を管理します。Clerk と連携。

### カラム定義

| カラム名    | データ型     | NULL | デフォルト | 制約   | 説明                        |
| ----------- | ------------ | ---- | ---------- | ------ | --------------------------- |
| Id          | TEXT         | NO   | -          | PK     | 主キー（Clerk ユーザー ID） |
| Email       | VARCHAR(255) | NO   | -          | UNIQUE | メールアドレス              |
| DisplayName | VARCHAR(100) | YES  | NULL       | -      | 表示名                      |
| AvatarUrl   | VARCHAR(500) | YES  | NULL       | -      | アバター画像URL             |
| CreatedAt   | TIMESTAMP    | NO   | now()      | -      | 作成日時                    |
| UpdatedAt   | TIMESTAMP    | NO   | now()      | -      | 更新日時                    |

### インデックス

| インデックス名 | カラム | 種類        |
| -------------- | ------ | ----------- |
| PK_Users       | Id     | PRIMARY KEY |
| IX_Users_Email | Email  | UNIQUE      |

### SQL

```sql
CREATE TABLE Users (
    Id TEXT PRIMARY KEY,
    Email VARCHAR(255) NOT NULL UNIQUE,
    DisplayName VARCHAR(100),
    AvatarUrl VARCHAR(500),
    CreatedAt TIMESTAMP NOT NULL DEFAULT now(),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
```

---

## Songs テーブル

楽曲（コード譜）情報を管理します。

### カラム定義

| カラム名      | データ型     | NULL | デフォルト        | 制約           | 説明            |
| ------------- | ------------ | ---- | ----------------- | -------------- | --------------- |
| Id            | UUID         | NO   | gen_random_uuid() | PK             | 主キー          |
| UserId        | TEXT         | NO   | -                 | FK → Users     | 所有者          |
| Title         | VARCHAR(200) | NO   | -                 | -              | 曲名            |
| Artist        | VARCHAR(200) | YES  | NULL              | -              | アーティスト名  |
| Key           | VARCHAR(10)  | YES  | NULL              | -              | キー（C, Am等） |
| Bpm           | INT          | YES  | NULL              | CHECK(Bpm > 0) | テンポ          |
| TimeSignature | VARCHAR(10)  | NO   | '4/4'             | -              | 拍子            |
| Content       | TEXT         | NO   | '{"sections":[]}' | -              | コード譜データ  |
| Visibility    | INT          | NO   | 0                 | CHECK(0-3)     | 公開設定        |
| IsDemo        | BOOLEAN      | NO   | false             | -              | デモ用曲フラグ  |
| CreatedAt     | TIMESTAMP    | NO   | now()             | -              | 作成日時        |
| UpdatedAt     | TIMESTAMP    | NO   | now()             | -              | 更新日時        |

### Visibility 値

| 値  | 名前          | 説明                  |
| --- | ------------- | --------------------- |
| 0   | Private       | 非公開（作成者のみ）  |
| 1   | UrlOnly       | URLを知っている人のみ |
| 2   | SpecificUsers | 特定ユーザーのみ      |
| 3   | Public        | 全員に公開            |

### インデックス

| インデックス名      | カラム     | 種類        |
| ------------------- | ---------- | ----------- |
| PK_Songs            | Id         | PRIMARY KEY |
| IX_Songs_UserId     | UserId     | INDEX       |
| IX_Songs_Visibility | Visibility | INDEX       |
| IX_Songs_IsDemo     | IsDemo     | INDEX       |
| FK_Songs_Users      | UserId     | FOREIGN KEY |

### SQL

```sql
CREATE TABLE Songs (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId TEXT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    Title VARCHAR(200) NOT NULL,
    Artist VARCHAR(200),
    Key VARCHAR(10),
    Bpm INT CHECK (Bpm > 0),
    TimeSignature VARCHAR(10) NOT NULL DEFAULT '4/4',
    Content TEXT NOT NULL DEFAULT '{"sections":[]}',
    Visibility INT NOT NULL DEFAULT 0 CHECK (Visibility BETWEEN 0 AND 3),
    IsDemo BOOLEAN NOT NULL DEFAULT false,
    CreatedAt TIMESTAMP NOT NULL DEFAULT now(),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IX_Songs_UserId ON Songs(UserId);
CREATE INDEX IX_Songs_Visibility ON Songs(Visibility);
CREATE INDEX IX_Songs_IsDemo ON Songs(IsDemo);
```

---

## Bookmarks テーブル

ユーザーのブックマーク（お気に入り）を管理します。

### カラム定義

| カラム名  | データ型  | NULL | デフォルト        | 制約       | 説明     |
| --------- | --------- | ---- | ----------------- | ---------- | -------- |
| Id        | UUID      | NO   | gen_random_uuid() | PK         | 主キー   |
| UserId    | TEXT      | NO   | -                 | FK → Users | ユーザー |
| SongId    | UUID      | NO   | -                 | FK → Songs | 楽曲     |
| CreatedAt | TIMESTAMP | NO   | now()             | -          | 作成日時 |
| UpdatedAt | TIMESTAMP | NO   | now()             | -          | 更新日時 |

### インデックス

| インデックス名         | カラム           | 種類        |
| ---------------------- | ---------------- | ----------- |
| PK_Bookmarks           | Id               | PRIMARY KEY |
| IX_Bookmarks_UserId    | UserId           | INDEX       |
| UQ_Bookmarks_User_Song | (UserId, SongId) | UNIQUE      |

### SQL

```sql
CREATE TABLE Bookmarks (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    UserId TEXT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    SongId UUID NOT NULL REFERENCES Songs(Id) ON DELETE CASCADE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT now(),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(UserId, SongId)
);

CREATE INDEX IX_Bookmarks_UserId ON Bookmarks(UserId);
```

---

## SongShares テーブル

楽曲の共有リンクを管理します。

### カラム定義

| カラム名   | データ型    | NULL | デフォルト        | 制約       | 説明         |
| ---------- | ----------- | ---- | ----------------- | ---------- | ------------ |
| Id         | UUID        | NO   | gen_random_uuid() | PK         | 主キー       |
| SongId     | UUID        | NO   | -                 | FK → Songs | 楽曲         |
| ShareToken | VARCHAR(50) | NO   | -                 | UNIQUE     | 共有トークン |
| ExpiresAt  | TIMESTAMP   | YES  | NULL              | -          | 有効期限     |
| CreatedAt  | TIMESTAMP   | NO   | now()             | -          | 作成日時     |
| UpdatedAt  | TIMESTAMP   | NO   | now()             | -          | 更新日時     |

### インデックス

| インデックス名           | カラム     | 種類        |
| ------------------------ | ---------- | ----------- |
| PK_SongShares            | Id         | PRIMARY KEY |
| IX_SongShares_ShareToken | ShareToken | UNIQUE      |
| FK_SongShares_Songs      | SongId     | FOREIGN KEY |

### SQL

```sql
CREATE TABLE SongShares (
    Id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    SongId UUID NOT NULL REFERENCES Songs(Id) ON DELETE CASCADE,
    ShareToken VARCHAR(50) NOT NULL UNIQUE,
    ExpiresAt TIMESTAMP,
    CreatedAt TIMESTAMP NOT NULL DEFAULT now(),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IX_SongShares_ShareToken ON SongShares(ShareToken);
```

---

## Content カラムの JSON スキーマ

Songs.Content に格納される JSON の構造（現行形式）:

```json
{
  "sections": [
    {
      "id": "section-1",
      "name": "イントロ",
      "type": "chord-only",
      "content": "{\"lines\":[{\"id\":\"line-1\",\"lyrics\":\"\",\"chords\":[{\"id\":\"chord-1\",\"chord\":\"C\",\"offset\":0.2}]}]}"
    },
    {
      "id": "section-2",
      "name": "Aメロ",
      "type": "lyrics-chord",
      "content": "{\"lines\":[{\"id\":\"line-2\",\"lyrics\":\"きょうも いちにち\",\"chords\":[{\"id\":\"chord-2\",\"chord\":\"C\",\"offset\":0.05}]}]}"
    }
  ]
}
```

- ルートは `{ "sections": Section[] }`
- 各 Section の `content` は `{ "lines": [...] }` 形式の JSON 文字列
- Section `type` は `lyrics-chord` または `chord-only`
- コード位置は `offset`（0〜1）

フロントエンドは旧形式（トップレベル配列 + `lines` 直下など）も読み取り時に変換します。

---

## 関連ドキュメント

- [ER図](./er-diagram.md) - エンティティ関連図
- [バックエンドアーキテクチャ](../architecture/backend.md) - Entity Framework Core
