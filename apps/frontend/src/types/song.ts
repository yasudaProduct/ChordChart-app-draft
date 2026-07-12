export type SectionType = 'lyrics-chord' | 'chord-only'

export type SongVisibility = 'private' | 'url-only' | 'specific-users' | 'public'

// 行・コードのランタイム型（ChordBlock / SectionLine / SectionContent）は
// パース・シリアライズ処理と一体のため `@/lib/sectionContent` に定義している。

export type Section = {
  id: string
  name: string
  type: SectionType
  content: string
}

export type SongMeta = {
  title: string
  artist?: string
  key?: string
  bpm?: number
  timeSignature: string
}

export type Song = SongMeta & {
  id: string
  sections: Section[]
  visibility: SongVisibility
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
