import type { Song } from '@/types/song'

const STORAGE_KEY = 'chordbook:demo-songs'

const getAll = (): Record<string, Song> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const demoSongStorage = {
  get(id: string): Song | null {
    return getAll()[id] ?? null
  },

  save(song: Song): Song {
    const all = getAll()
    const updated = { ...song, updatedAt: new Date().toISOString() }
    all[song.id] = updated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    return updated
  },

  has(id: string): boolean {
    return id in getAll()
  },
}
