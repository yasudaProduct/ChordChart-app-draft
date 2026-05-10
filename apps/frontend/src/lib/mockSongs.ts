import { serializeSectionContent } from '@/lib/sectionContent'
import type { Song, SongListItem, SongMeta, SongVisibility } from '@/types/song'

const STORAGE_KEY = 'chordbook:songs'

const nowIso = () => new Date().toISOString()

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `song_${Math.random().toString(36).slice(2, 10)}`
}

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const parseBarContent = (content: string | undefined) => {
  if (!content) return serializeSectionContent([])
  const bars = content
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
  if (bars.length === 0) return serializeSectionContent([])
  const chords = bars.map((chord, index) => ({
    chord,
    offset: (index + 1) / (bars.length + 1),
  }))
  return serializeSectionContent([createLine('', chords)])
}

const normalizeStoredSongs = (songs: Song[]): Song[] =>
  songs.map((song) => ({
    ...song,
    sections: song.sections.map((section) => {
      if ((section as { type: string }).type === 'bar') {
        return {
          ...section,
          type: 'chord-only',
          content: parseBarContent(section.content),
        }
      }
      return section
    }),
  }))

const createLine = (lyrics: string, chords: Array<{ chord: string; offset: number }>) => ({
  id: createId(),
  lyrics,
  chords: chords.map((item) => ({
    id: createId(),
    chord: item.chord,
    offset: item.offset,
  })),
})

const seedSongs = (): Song[] => [
  {
    id: createId(),
    title: '夜のグルーヴ',
    artist: 'ChordBook',
    key: 'Am',
    bpm: 96,
    timeSignature: '4/4',
    visibility: 'private',
    sections: [
      {
        id: createId(),
        name: 'Intro',
        type: 'chord-only',
        content: serializeSectionContent([
          createLine('', [
            { chord: 'Am', offset: 0.1 },
            { chord: 'F', offset: 0.35 },
            { chord: 'C', offset: 0.6 },
            { chord: 'G', offset: 0.85 },
          ]),
        ]),
      },
      {
        id: createId(),
        name: 'Aメロ',
        type: 'lyrics-chord',
        content: serializeSectionContent([
          createLine('夜の風が うたう', [
            { chord: 'Am', offset: 0.05 },
            { chord: 'F', offset: 0.35 },
            { chord: 'C', offset: 0.6 },
            { chord: 'G', offset: 0.85 },
          ]),
        ]),
      },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: createId(),
    title: 'Sunrise Road',
    artist: 'Demo Band',
    key: 'C',
    bpm: 120,
    timeSignature: '4/4',
    visibility: 'public',
    sections: [
      {
        id: createId(),
        name: 'Chorus',
        type: 'lyrics-chord',
        content: serializeSectionContent([
          createLine('Shine on, shine on', [
            { chord: 'C', offset: 0.05 },
            { chord: 'G', offset: 0.35 },
            { chord: 'Am', offset: 0.6 },
            { chord: 'F', offset: 0.85 },
          ]),
        ]),
      },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
]

const readSongs = (): Song[] => {
  if (typeof window === 'undefined') return []
  const stored = safeParse<Song[]>(localStorage.getItem(STORAGE_KEY), [])
  if (stored.length > 0) {
    const normalized = normalizeStoredSongs(stored)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  }
  const seeded = seedSongs()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

const writeSongs = (songs: Song[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
}

const toListItem = (song: Song): SongListItem => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  key: song.key,
  updatedAt: song.updatedAt,
})

const normalizeVisibility = (value?: SongVisibility): SongVisibility => value ?? 'private'

export const mockSongsApi = {
  async list(): Promise<SongListItem[]> {
    const songs = readSongs()
    return songs
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toListItem)
  },

  async search(query?: string): Promise<SongListItem[]> {
    const songs = readSongs()
    const items = songs
      .filter((s) => s.visibility === 'public')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toListItem)
    if (!query?.trim()) return items
    const lower = query.toLowerCase()
    return items.filter(
      (s) =>
        s.title.toLowerCase().includes(lower) ||
        (s.artist ?? '').toLowerCase().includes(lower) ||
        (s.key ?? '').toLowerCase().includes(lower)
    )
  },

  async get(id: string): Promise<Song> {
    const songs = readSongs()
    const song = songs.find((item) => item.id === id)
    if (!song) {
      throw new Error('Song not found')
    }
    return song
  },

  async create(meta: SongMeta, visibility?: SongVisibility): Promise<Song> {
    const songs = readSongs()
    const timestamp = nowIso()
    const song: Song = {
      id: createId(),
      title: meta.title,
      artist: meta.artist ?? '',
      key: meta.key ?? '',
      bpm: meta.bpm,
      timeSignature: meta.timeSignature || '4/4',
      visibility: normalizeVisibility(visibility),
      sections: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const next = [song, ...songs]
    writeSongs(next)
    return song
  },

  async update(id: string, updates: Partial<Song>): Promise<Song> {
    const songs = readSongs()
    const index = songs.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error('Song not found')
    }
    const current = songs[index]
    const updated: Song = {
      ...current,
      ...updates,
      visibility: normalizeVisibility(
        (updates.visibility as SongVisibility | undefined) ?? current.visibility
      ),
      updatedAt: nowIso(),
    }
    const next = songs.slice()
    next[index] = updated
    writeSongs(next)
    return updated
  },

  async remove(id: string): Promise<void> {
    const songs = readSongs()
    const next = songs.filter((item) => item.id !== id)
    writeSongs(next)
  },
}
