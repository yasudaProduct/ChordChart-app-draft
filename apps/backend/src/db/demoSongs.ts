import { sampleSongContents } from './seedContent'

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
    title: 'Demo Song - Acoustic Ballad',
    artist: 'ChordBook',
    key: 'C',
    bpm: 72,
    timeSignature: '4/4',
    content: sampleSongContents[0],
  },
  {
    title: 'Demo Song - Up-tempo Rock',
    artist: 'ChordBook',
    key: 'G',
    bpm: 132,
    timeSignature: '4/4',
    content: sampleSongContents[1],
  },
  {
    title: 'Demo Song - Jazz Standard',
    artist: 'ChordBook',
    key: 'F',
    bpm: 96,
    timeSignature: '3/4',
    content: sampleSongContents[2],
  },
] as const
