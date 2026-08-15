import { buildSongContent } from './seedContent'

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
] as const
