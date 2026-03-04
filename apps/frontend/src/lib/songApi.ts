import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { Section, Song, SongListItem, SongMeta, SongVisibility } from '@/types/song'

type ApiSongDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  bpm: number | null
  timeSignature: string
  content: string
  visibility: number | string | null
  createdAt: string
  updatedAt: string
}

type ApiSongListItemDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  updatedAt: string
}

const isAuthenticated = (): boolean => {
  return useAuthStore.getState().session !== null
}

const safeJsonParse = (value: string | null): { sections: Section[] } => {
  if (!value) return { sections: [] }
  try {
    const parsed = JSON.parse(value) as { sections?: Section[] }
    return { sections: Array.isArray(parsed.sections) ? parsed.sections : [] }
  } catch {
    return { sections: [] }
  }
}

const mapVisibility = (value: ApiSongDto['visibility']): SongVisibility => {
  if (typeof value === 'string') {
    if (value.toLowerCase().includes('url')) return 'url-only'
    if (value.toLowerCase().includes('specific')) return 'specific-users'
    if (value.toLowerCase().includes('public')) return 'public'
    return 'private'
  }
  switch (value) {
    case 1:
      return 'url-only'
    case 2:
      return 'specific-users'
    case 3:
      return 'public'
    default:
      return 'private'
  }
}

const toSong = (dto: ApiSongDto): Song => {
  const { sections } = safeJsonParse(dto.content)
  return {
    id: dto.id,
    title: dto.title,
    artist: dto.artist ?? '',
    key: dto.key ?? '',
    bpm: dto.bpm ?? undefined,
    timeSignature: dto.timeSignature ?? '4/4',
    sections,
    visibility: mapVisibility(dto.visibility),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

const toSongListItem = (dto: ApiSongListItemDto): SongListItem => ({
  id: dto.id,
  title: dto.title,
  artist: dto.artist ?? '',
  key: dto.key ?? '',
  updatedAt: dto.updatedAt,
})

const toContent = (sections: Section[]) => JSON.stringify({ sections })

export const songApi = {
  async list(): Promise<SongListItem[]> {
    const response = await api.get<ApiSongListItemDto[]>('/songs')
    return response.map(toSongListItem)
  },

  async get(id: string): Promise<Song> {
    const dto = await api.get<ApiSongDto>(`/songs/${id}`)
    return toSong(dto)
  },

  async create(meta: SongMeta, visibility?: SongVisibility): Promise<Song> {
    if (!isAuthenticated()) {
      throw new Error('ログインが必要です')
    }
    const dto = await api.post<ApiSongDto>('/songs', {
      title: meta.title,
      artist: meta.artist ?? null,
      key: meta.key ?? null,
      bpm: meta.bpm ?? null,
      timeSignature: meta.timeSignature || '4/4',
    })
    return toSong(dto)
  },

  async update(id: string, updates: Song): Promise<Song> {
    if (!isAuthenticated()) {
      throw new Error('ログインが必要です')
    }
    const dto = await api.put<ApiSongDto>(`/songs/${id}`, {
      title: updates.title ?? '',
      artist: updates.artist ?? null,
      key: updates.key ?? null,
      bpm: updates.bpm ?? null,
      timeSignature: updates.timeSignature ?? '4/4',
      content: toContent(updates.sections ?? []),
    })
    return toSong(dto)
  },

  async search(query?: string): Promise<SongListItem[]> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    const response = await api.get<ApiSongListItemDto[]>(`/songs/search${params}`)
    return response.map(toSongListItem)
  },

  async remove(id: string): Promise<void> {
    if (!isAuthenticated()) {
      throw new Error('ログインが必要です')
    }
    await api.delete(`/songs/${id}`)
  },
}
