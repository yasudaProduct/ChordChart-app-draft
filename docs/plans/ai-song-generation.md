# AI連携によるソングデータ作成 — 実現方式の検討

## 目的

「ユーザーが自然言語でAIに指示を出すと、ChordBook のソングデータ（コード譜）が作成される」体験を実現する。

要件の原文は「アカウントを持っているユーザーが**各々のAI**に指示を出してソングデータを作成してもらう」。この「各々のAI」には2通りの解釈がある。

| 解釈                             | 体験イメージ                                                                                             | 対応する方式                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **① ユーザー自身のAI（外部AI）** | ユーザーが普段使っている ChatGPT / Claude / Claude Code / Cursor 等から ChordBook を操作し、曲を作らせる | 方式B（MCP）/ 方式C（公開API）/ 方式D（インポート） |
| ② アプリ内のAI機能               | ChordBook 内のチャット欄に「キーCで王道進行のバラードを作って」と入力すると下書きが生成される            | 方式A（アプリ内蔵AI）                               |

本書は文言どおり **①を本命** として整理しつつ、②も選択肢として比較する。最終的にどちらを採るかに関わらず共通で必要になる基盤（AI向けソングフォーマット）があるため、そこを起点にした段階導入を推奨する。

---

## 現状分析（設計の前提）

### 1. content のデータ形式は「AIに直接書かせる」には不向き

`Songs.Content` は次の**二重ネストJSON文字列**で、コード位置は `offset`（0〜1 の相対位置・小数）で表現される（`apps/frontend/src/lib/sectionContent.ts`）。

```json
{
  "sections": [
    {
      "id": "section-1",
      "name": "Aメロ",
      "type": "lyrics-chord",
      "content": "{\"lines\":[{\"id\":\"line-1\",\"lyrics\":\"きょうも いちにち\",\"chords\":[{\"id\":\"chord-1\",\"chord\":\"C\",\"offset\":0.05}]}]}"
    }
  ]
}
```

- JSON文字列の中にさらにJSON文字列（セクション `content`）が入る形式は、LLMがエスケープを崩しやすい。
- `offset: 0.37` のような小数の相対位置は、LLMには意味付けが困難（「どの文字の上か」を数値で言えない）。
- `id` はクライアント生成のランダム値で、AIに生成させる意味がない。

→ **どの方式でも、AIに書かせるのは「AI向けの中間フォーマット」とし、内部形式へはコードで決定的に変換する**のが必須の土台になる。

### 2. 認証は Clerk のセッションJWTのみ＝外部AIからは叩けない

バックエンドの認証は `Authorization: Bearer <Clerk セッショントークン>` の一本のみ（`apps/backend/src/middleware/auth.ts`）。Clerk のセッショントークンは短命でSDKが自動更新する前提のため、外部のAIエージェントに渡す手段がない。

→ 外部AI連携（方式B/C）には **ユーザーごとのAPIトークン（PAT）または OAuth** の追加が必要。これが①系の方式の主な追加開発ポイント。

### 3. インフラ・スタックとの相性は良い

- バックエンドは Hono / Cloudflare Workers。MCPサーバーは Hono 公式の [`@hono/mcp`](https://jsr.io/@hono/mcp)（Streamable HTTP transport）で既存 Worker に相乗りできる。
- 認証基盤の Clerk は MCP 向けの OAuth（動的クライアント登録・CIMD）を公式サポートしており（[Clerk Docs](https://clerk.com/docs/nextjs/guides/ai/mcp/build-mcp-server), [clerk/mcp-tools](https://github.com/clerk/mcp-tools)）、将来 claude.ai / ChatGPT のコネクタ対応まで伸ばせる。
- 音楽理論ロジック（`tonal` ベースの `lib/music`）が既にあり、AI出力の**コード表記バリデーション**（`parseChordSymbol` / `parseKeyName`）に転用できる。
- Anthropic API（方式A）は Workers から fetch で呼べる（I/O待ちが支配的でCPU時間の制約に掛かりにくい）。

### 4. 既存ロードマップとの関係

`docs/plans/feature-roadmap.md` の **E18（公開API）・E15（AIコード進行提案）・G16（インポート）** と重なる領域。本件を進めることは E18/G16 の前倒しを兼ねる。

---

## 実現方式の選択肢

### 方式D: プロンプトテンプレート + インポート（コピペ連携）

アプリは「AIに渡すためのプロンプトテンプレート（フォーマット仕様入り）」を提供し、ユーザーは任意のAI（ChatGPT等）にそれを貼って生成させ、**結果のテキストをアプリのインポート画面に貼り戻す**。アプリ側はパース→バリデーション→プレビュー→保存。

- 開発規模: **小**（フォーマット定義＋パーサ＋インポートUI。バックエンド変更ほぼ不要）
- 認証追加: 不要（通常のログインセッション内で完結）
- 対応AI: **すべて**（無料プランのAIでも可）
- 弱点: 体験が2ステップで「魔法感」は薄い。曲の更新・検索などの対話的操作はできない

### 方式C: 公開REST API + パーソナルアクセストークン（PAT)

設定画面でユーザーがAPIトークンを発行し、既存の Song CRUD API（＋AI向けフォーマットで受けるインポート用エンドポイント）を外部から叩けるようにする。API仕様書（またはOpenAPI）をAIに渡せば、HTTPツールを持つAIエージェントが曲を作成できる。

- 開発規模: **中**（PAT発行/失効UI・トークン認証ミドルウェア・レート制限・API公開ドキュメント）
- 対応AI: HTTP を叩けるエージェント（Claude Code, ChatGPT のツール実行, 自作スクリプト等）
- 弱点: AIごとに「API仕様を教える」手間が残る。一般ユーザーにはハードルが高い
- 備考: ロードマップ **E18（公開API）** そのもの。方式Bの土台にもなる

### 方式B: MCPサーバー（本命候補）★

ChordBook が **MCP (Model Context Protocol) サーバー**を公開し、ユーザーは自分のAIクライアント（Claude / Claude Code / Cursor / ChatGPT 等）に接続設定を1回行うだけで、以後は自然言語で「◯◯って曲のコード譜を作って」と指示できる。ツール定義がAIに自動提供されるため、方式Cのような「API仕様を教える」手間がない。

- 実装: 既存 Worker に `/api/mcp` を追加（`@hono/mcp` + MCP TypeScript SDK、Streamable HTTP・ステートレス）。ツールは既存の service 層を呼ぶ薄いラッパー
- 認証は2段階で拡張できる:
  - **第1段階: PAT認証**（`Authorization` ヘッダー）— Claude Code / Cursor / VS Code 等の開発者系クライアントで動く。実装が簡単
  - **第2段階: Clerk OAuth**（動的クライアント登録）— claude.ai / ChatGPT の「コネクタ」など、OAuth必須のコンシューマ向けクライアントに対応
- ツール案（v1）:

| ツール                | 内容                               | 備考                                  |
| --------------------- | ---------------------------------- | ------------------------------------- |
| `create_song`         | AI向けフォーマットで曲を新規作成   | visibility は `private` 固定          |
| `update_song`         | 既存曲のメタ・セクションを更新     | 所有者チェックは既存 service を再利用 |
| `get_song`            | 自分の曲をAI向けフォーマットで取得 | 「サビだけ直して」等の編集指示に必要  |
| `list_my_songs`       | 自分の曲一覧                       |                                       |
| `search_public_songs` | 公開曲検索                         | 任意。参照用                          |

（`delete_song` は誤爆リスクが高いため v1 では提供しない）

- 開発規模: **中**（方式Cの認証基盤＋MCPエンドポイント。OAuth化まで含めると中〜大）
- 弱点: MCP接続設定という一手間は残る（ただしOAuth対応後はURL貼り付け＋ログインだけになる）。運用コストはWorkers内で完結しほぼゼロ

### 方式A: アプリ内蔵AI生成（Claude API）

バックエンドに `POST /api/ai/generate-song` を追加し、サーバー側で Claude API を呼んで自然言語→AI向けフォーマットの曲データを生成。フロントは生成結果をエディタでプレビューし、ユーザーが確認して保存する。

- モデル: 既定は `claude-opus-5`（$5/$25 per MTok）。コスト重視なら `claude-sonnet-5`（$3/$15、2026-08-31 まで導入価格 $2/$10）や `claude-haiku-4-5`（$1/$5）が選択肢（採用判断は実装時に品質評価の上で）
- 生成の堅牢化: Structured Outputs（`output_config.format` の JSON Schema 指定）でAI向けフォーマットへの準拠を強制し、さらに Zod + `tonal` で検証
- コスト目安: 1生成 入力1〜2K・出力1〜3Kトークン程度 → opus-5 で数円〜十数円/回のオーダー。**運営側がAPIコストを負担**するため、ユーザーごとの回数クォータ（日次N回等）が必須
- 開発規模: **中**（エンドポイント＋プロンプト設計＋クォータ管理＋プレビューUI。ストリーミング表示まで作ると大）
- 強み: アプリ内で完結する最良のUX。AIを持たないユーザーにも届く
- 弱点: ランニングコスト（従量）と不正利用対策の運用負担。「各々のAIに指示」という要件文言とはややズレる

---

## 比較まとめ

|                      | D: コピペ連携 | C: 公開API+PAT    | B: MCPサーバー            | A: 内蔵AI           |
| -------------------- | ------------- | ----------------- | ------------------------- | ------------------- |
| 「各々のAI」への合致 | ○             | ○                 | **◎**                     | △（アプリのAI）     |
| 体験の滑らかさ       | △（貼り戻し） | △（仕様を教える） | ○〜◎                      | ◎                   |
| 対応ユーザー層       | 全員          | 技術者寄り        | AIクライアント利用者      | 全員                |
| 追加の認証基盤       | 不要          | PAT               | PAT →（後に）OAuth        | 不要                |
| 開発規模             | 小            | 中                | 中（OAuthまで含め中〜大） | 中〜大              |
| ランニングコスト     | なし          | ほぼなし          | ほぼなし                  | **従量（LLM API）** |
| 主なリスク           | 体験が地味    | レート制限・悪用  | クライアント互換性        | コスト・悪用        |

---

## 推奨: 共通基盤を作り、D → C+B(PAT) → B(OAuth) →（任意で）A の順に段階導入

どの方式を選んでも必要になる **Phase 0** から着手すれば、方針転換しても無駄にならない。

### Phase 0: AI向けソングフォーマット v1 ＋ 変換・検証基盤（すべての土台）

新しいワークスペースパッケージ `packages/song-format`（`@chordbook/song-format`）を作り、FE/BE 双方から使う。

**フォーマット案（AIが生成しやすい形）:**

```json
{
  "title": "夕焼けの帰り道",
  "artist": null,
  "key": "C",
  "bpm": 82,
  "timeSignature": "4/4",
  "sections": [
    {
      "name": "イントロ",
      "type": "chord-only",
      "lines": [{ "chords": ["C", "G/B", "Am", "F"] }]
    },
    {
      "name": "Aメロ",
      "type": "lyrics-chord",
      "lines": [
        {
          "lyrics": "きょうも いちにち おわるよ",
          "chords": [
            { "chord": "C", "at": 0 },
            { "chord": "G", "at": 5 },
            { "chord": "F", "at": 11 }
          ]
        }
      ]
    }
  ]
}
```

- `at` は**歌詞の文字インデックス**（0始まり）。内部形式へは `offset = at / max(歌詞文字数, 1)` で決定的に変換し、`id` は変換時に採番。`chord-only` 行は等間隔配置（`offset = i / n`）
- 逆変換（内部形式→AI向け）も実装し、`get_song` / エクスポート / プロンプト例示に使う
- バリデーション: Zod スキーマ＋ `tonal`（`parseChordSymbol` / `parseKeyName`）でコード表記・キーを検証。不正コードは「エラーで拒否」ではなく警告付きで取り込み、エディタ上で修正できるようにする
- 補助として **ChordPro 風テキスト**（`[C]きょうも [G]いちにち`）のパーサも用意すると良い。LLMは ChordPro を学習しており、JSONよりさらに崩れにくい（インポートの受け口は「JSON or ChordPro風テキスト」の2形式）

### Phase 1: インポートUI（方式D）— 最短で価値検証

- 曲作成画面に「AIで作成」導線: ①フォーマット仕様入りプロンプトテンプレートをコピー → ②任意のAIで生成 → ③貼り戻してプレビュー → ④保存
- ロードマップ **G16（インポート）** も同時に満たす。ここでフォーマットの実用性（AIがどれだけ正しく生成できるか）を検証してから外部公開に進む

### Phase 2: PAT ＋ 公開API ＋ MCPサーバー（方式C+B の第1段階）— 要件の本命

1. **PAT基盤**: `ApiTokens` テーブル新設（スキーマ案は下記）、設定画面で発行・失効、`authMiddleware` を「Clerk JWT or PAT」の二本立てに拡張
2. **公開API**: `POST /api/songs/import`（AI向けフォーマットで受けて作成）等を追加し、`docs/api` に外部利用者向け仕様を整備。レート制限を導入（現状「未実装」— 公開の前提条件）
3. **MCPサーバー**: `/api/mcp` に上記ツール5種を実装（PAT認証）。Claude Code / Cursor 等で動作確認

```ts
// ApiTokens テーブル案（Drizzle）
{
  id: uuid PK,
  userId: text FK(Users) onDelete cascade,
  name: varchar(100),          // 「Claude用」等の表示名
  tokenHash: text unique,      // SHA-256。平文は発行時に一度だけ表示
  tokenPrefix: varchar(12),    // 一覧表示用 (例: cbk_a1b2…)
  scopes: varchar(200),        // 例: "songs:read songs:write"
  lastUsedAt / expiresAt / createdAt: timestamp
}
```

### Phase 3: Clerk OAuth 化（方式Bの第2段階）

- MCPサーバーの認証を Clerk の OAuth（動的クライアント登録）に対応させ、claude.ai / ChatGPT のカスタムコネクタから「URL登録→ChordBookにログイン→許可」だけで接続できるようにする。非エンジニアのユーザーにも届く形
- 各クライアントの対応状況（ヘッダー認証可否・OAuth要件）は変化が速いため、実装時に最新仕様を要確認

### Phase 4（任意）: アプリ内蔵AI生成（方式A）

- Phase 0 の基盤（フォーマット＋検証）をそのまま使い、`POST /api/ai/generate-song` を追加。Structured Outputs でフォーマット準拠を強制
- コスト負担モデル（運営負担＋日次クォータ / 将来のプレミアム特典化 = ロードマップ E19）を決めてから着手
- ハリボテ解消済みのコード補完（G6）の延長として「進行の続きを提案」等への発展も可能（E15）

---

## セキュリティ・運用上の考慮

- **トークン管理**: PATはハッシュのみ保存・平文は発行時のみ表示。スコープで書き込み範囲を限定し、失効UIを必須にする
- **認可**: MCP/APIの全ツールは既存 service 層の所有者チェック（`userId` 条件）を通す。AIからの作成は `visibility: private` 固定とし、公開はアプリ内でのユーザー操作に限る
- **入力検証**: AI出力は信頼しない。Zod＋`tonal` の検証を通過したものだけ内部形式に変換（セクション数・行数・文字数の上限も設ける）
- **レート制限・クォータ**: 公開API/MCPにレート制限（Cloudflare のレートルール等）。方式Aは日次生成回数クォータ＋モデル選定でコスト上限を設計
- **著作権**: 「既存曲名を指定してAIに作らせる」使い方が想定されるため、**歌詞**の自動生成・転載は権利リスクが高い。v1では「コード進行＋セクション構成のみ生成（歌詞は空）」をデフォルトにする、生成物の公開時の注意喚起を出す、などのポリシーを決めておく
- **プロンプトインジェクション**: 方式B/Cはユーザー自身のAIが加害者になり得ない構図（通常のAPI不正入力と同等）。方式Aはユーザー入力をそのままLLMに渡すため、システムプロンプトで役割を固定し、出力はスキーマ検証のみで受ける

---

## 決めたい論点（確認事項）

1. **「各々のAI」の意図**: 外部AI連携（本書の本命）で合っているか。アプリ内AI機能（方式A）を先にやりたい可能性はあるか
2. **最初のターゲットクライアント**: Claude Code / Cursor 等の開発者系で良いか、初期から claude.ai / ChatGPT コネクタ（=OAuth必須）を狙うか
3. **歌詞の扱い**: AI生成はコード進行のみに限定するか、歌詞も許容するか（著作権ポリシー）
4. **方式Aをやる場合のコスト負担**: 運営負担＋クォータか、将来の課金特典（E19）に紐付けるか

---

## 参考リンク

- [@hono/mcp（Hono公式 MCP ミドルウェア）](https://jsr.io/@hono/mcp) / [Hono third-party middleware](https://hono.dev/docs/middleware/third-party)
- [Hono + Streamable HTTP のステートレスMCPサーバー例（Cloudflare Workers）](https://github.com/mhart/mcp-hono-stateless)
- [Clerk: Build an MCP server in your application](https://clerk.com/docs/nextjs/guides/ai/mcp/build-mcp-server) / [clerk/mcp-tools](https://github.com/clerk/mcp-tools) / [Clerk OAuth の実装（DCR/CIMD）](https://clerk.com/docs/guides/configure/auth-strategies/oauth/how-clerk-implements-oauth)
- 関連ドキュメント: [機能拡充ロードマップ](./feature-roadmap.md)（E15 / E18 / G16）, [API 概要](../api/overview.md), [ER図](../database/er-diagram.md)
