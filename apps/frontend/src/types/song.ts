export type SectionType = 'lyrics-chord' | 'chord-only'

export type SongVisibility = 'private' | 'url-only' | 'specific-users' | 'public'

// 行・コードのランタイム型（ChordBlock / SectionLine / SectionContent）は
// パース・シリアライズ処理と一体のため `@/lib/sectionContent` に定義している。

/**
 * キー・BPM・拍子。楽曲全体とセクションで同じ形を使う。
 * いずれも任意で、未設定の場合は undefined（API 上は null）。
 */
export type MusicMeta = {
  key?: string
  bpm?: number
  timeSignature?: string
}

/**
 * セクション（イントロ・Aメロ等）。
 * キー・BPM・拍子は未設定なら直前のセクション → 楽曲全体の順に継承する（`@/lib/sectionMeta`）。
 *
 * 注意: `key` を持つため、このオブジェクトを JSX の props にスプレッドしないこと
 * （React の予約 prop `key` と衝突する）。
 */
export type Section = MusicMeta & {
  id: string
  name: string
  type: SectionType
  content: string
}

export type SongMeta = MusicMeta & {
  title: string
  artist?: string
}

export type Song = SongMeta & {
  id: string
  sections: Section[]
  visibility: SongVisibility
  isOwner?: boolean
  createdAt: string
  updatedAt: string
}

export type SongListItem = {
  id: string
  title: string
  artist?: string
  key?: string
  updatedAt: string
}
