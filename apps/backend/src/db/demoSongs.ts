import { buildLyricsSongContent, buildSongContent } from './seedContent'

/**
 * デモ曲を保有する固定ユーザー。
 * Clerk 連携ユーザーとは独立させ、どの環境でも冪等に作成できるよう固定 ID を使う。
 */
export const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@chord-books.com',
  displayName: 'ChordBook Demo',
} as const

/**
 * デモ曲の定義。dev/test・staging/本番の両 seed で共有する。
 * `isDemo: true` を付与した曲としてフロントの `/demo` から参照される。
 */
export const demoSongs = [
  {
    title: '上を向いて歩こう',
    artist: '坂本九',
    key: 'F',
    bpm: 104,
    timeSignature: '4/4',
    content: buildSongContent([
      { prefix: 'ue-wo-muite-intro', name: 'Intro', chords: ['F', 'Am', 'Bb', 'C7'] },
      {
        prefix: 'ue-wo-muite-verse',
        name: 'Verse',
        chords: ['F', 'Am', 'Bb', 'C7', 'F', 'Dm', 'Gm', 'C7'],
      },
      {
        prefix: 'ue-wo-muite-chorus',
        name: 'Chorus',
        chords: ['Bb', 'C7', 'F', 'Dm', 'Gm', 'C7', 'F'],
      },
    ]),
  },
  {
    title: 'チェリー',
    artist: 'スピッツ',
    key: 'C',
    bpm: 186,
    timeSignature: '4/4',
    content: buildSongContent([
      {
        prefix: 'cherry-intro',
        name: 'Intro',
        chords: ['C', 'G/B', 'Am', 'Em/G', 'F', 'C/E', 'Dm7', 'G'],
      },
      {
        prefix: 'cherry-verse',
        name: 'Verse',
        chords: ['C', 'G/B', 'Am', 'Em/G', 'F', 'C/E', 'Dm7', 'G'],
      },
      {
        prefix: 'cherry-chorus',
        name: 'Chorus',
        chords: ['F', 'C', 'Dm7', 'G', 'Em', 'Am', 'F', 'G'],
      },
    ]),
  },
  {
    title: 'レット・イット・ビー',
    artist: 'The Beatles',
    key: 'C',
    bpm: 73,
    timeSignature: '4/4',
    content: buildSongContent([
      {
        prefix: 'let-it-be-verse',
        name: 'Verse',
        chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
      },
      {
        prefix: 'let-it-be-chorus',
        name: 'Chorus',
        chords: ['Am', 'G', 'F', 'C', 'F', 'C', 'G', 'F'],
      },
    ]),
  },
  // 作詞・作曲者の没後70年を経過し著作権が消滅しているため、歌詞を含めて掲載する
  // （野口雨情 1945年没、中山晋平 1952年没。詳細は docs/plans/copyright-safeguards-plan.md）。
  {
    title: 'シャボン玉',
    artist: '野口雨情・中山晋平',
    key: 'C',
    bpm: 72,
    timeSignature: '4/4',
    content: buildLyricsSongContent([
      {
        prefix: 'shabondama-v1',
        name: '1番',
        lines: [
          {
            lyrics: 'しゃぼん玉とんだ',
            chords: [
              { chord: 'C', at: 0 },
              { chord: 'G', at: 5 },
            ],
          },
          {
            lyrics: '屋根までとんだ',
            chords: [
              { chord: 'Am', at: 0 },
              { chord: 'F', at: 4 },
            ],
          },
          {
            lyrics: '屋根までとんで',
            chords: [
              { chord: 'C', at: 0 },
              { chord: 'G', at: 4 },
            ],
          },
          {
            lyrics: 'こわれて消えた',
            chords: [
              { chord: 'F', at: 0 },
              { chord: 'C', at: 4 },
            ],
          },
        ],
      },
      {
        prefix: 'shabondama-v2',
        name: '2番',
        lines: [
          {
            lyrics: 'しゃぼん玉消えた',
            chords: [
              { chord: 'C', at: 0 },
              { chord: 'G', at: 5 },
            ],
          },
          {
            lyrics: 'とばずに消えた',
            chords: [
              { chord: 'Am', at: 0 },
              { chord: 'F', at: 4 },
            ],
          },
          {
            lyrics: '生まれてすぐに',
            chords: [
              { chord: 'C', at: 0 },
              { chord: 'G', at: 4 },
            ],
          },
          {
            lyrics: 'こわれて消えた',
            chords: [
              { chord: 'F', at: 0 },
              { chord: 'C', at: 4 },
            ],
          },
        ],
      },
      {
        prefix: 'shabondama-v3',
        name: '3番',
        lines: [
          {
            lyrics: '風 風 吹くな',
            chords: [
              { chord: 'Dm', at: 0 },
              { chord: 'G', at: 4 },
            ],
          },
          {
            // 「しゃぼん玉」5拍+「とばそ」3拍。他行と同じく単語の切れ目(5文字目)でコードチェンジ。
            lyrics: 'しゃぼん玉とばそ',
            chords: [
              { chord: 'F', at: 0 },
              { chord: 'C', at: 5 },
            ],
          },
        ],
      },
    ]),
  },
  // 原曲は伝統曲（スコットランド民謡 Auld Lang Syne）でパブリックドメイン。
  // 日本語詞（稲垣千頴）も1881年発表で著作権保護期間を経過している。
  {
    title: '蛍の光',
    artist: '日本語詞:稲垣千頴／原曲:スコットランド民謡',
    key: 'G',
    bpm: 84,
    timeSignature: '4/4',
    content: buildLyricsSongContent([
      {
        prefix: 'hotarunohikari-v1',
        name: '1番',
        // 全4行とも「7拍+5拍(空白挟む)＝12拍」の同一旋律型（Auld Lang Syneの1フレーズ）を繰り返す。
        // 漢字1文字が複数拍になる語(蛍=ほたる3拍、光=ひかり3拍 等)があるため、
        // 文字インデックスではなく実際の拍数から求めた比率を offset に直接指定する。
        // 4行共通で 0拍目→G(or C)・4拍目→Em(or G)・7拍目→Am・10拍目→D7 の配置。
        lines: [
          {
            lyrics: '蛍の光　窓の雪',
            chords: [
              { chord: 'G', offset: 0 },
              { chord: 'Em', offset: 4 / 12 },
              { chord: 'Am', offset: 7 / 12 },
              { chord: 'D7', offset: 10 / 12 },
            ],
          },
          {
            lyrics: '文読む月日　重ねつつ',
            chords: [
              { chord: 'G', offset: 0 },
              { chord: 'Em', offset: 4 / 12 },
              { chord: 'Am', offset: 7 / 12 },
              { chord: 'D7', offset: 10 / 12 },
            ],
          },
          {
            lyrics: 'いつしか年も　すぎの戸を',
            chords: [
              { chord: 'C', offset: 0 },
              { chord: 'G', offset: 4 / 12 },
              { chord: 'Am', offset: 7 / 12 },
              { chord: 'D7', offset: 10 / 12 },
            ],
          },
          {
            // 最終行のみ、旋律の着地に合わせて末尾(11/12拍目)にGを追加しトニックへ解決する。
            lyrics: 'あけてぞ今朝は　別れ行く',
            chords: [
              { chord: 'G', offset: 0 },
              { chord: 'Em', offset: 4 / 12 },
              { chord: 'Am', offset: 7 / 12 },
              { chord: 'D7', offset: 10 / 12 },
              { chord: 'G', offset: 11 / 12 },
            ],
          },
        ],
      },
    ]),
  },
] as const
