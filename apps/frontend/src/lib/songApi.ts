import { api } from '@/lib/api'
import { parseSongContent } from '@/lib/parseSongContent'
import { useAuthStore } from '@/stores/authStore'
import type { Section, Song, SongListItem, SongMeta, SongVisibility } from '@/types/song'

export type ApiSongDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  bpm: number | null
  timeSignature: string
  content: string | { sections?: Section[] }
  visibility: string | null
  isOwner: boolean
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
  return useAuthStore.getState().user !== null
}

const mapVisibility = (value: ApiSongDto['visibility']): SongVisibility => {
  switch (value) {
    case 'url_only':
      return 'url-only'
    case 'specific_users':
      return 'specific-users'
    case 'public':
      return 'public'
    default:
      return 'private'
  }
}

/** フロントの kebab-case 表記を API の snake_case 表記へ変換する。 */
const toApiVisibility = (value: SongVisibility): string => {
  switch (value) {
    case 'url-only':
      return 'url_only'
    case 'specific-users':
      return 'specific_users'
    default:
      return value
  }
}

export const toSong = (dto: ApiSongDto): Song => {
  const sections = parseSongContent(dto.content)
  return {
    id: dto.id,
    title: dto.title,
    artist: dto.artist ?? '',
    key: dto.key ?? '',
    bpm: dto.bpm ?? undefined,
    timeSignature: dto.timeSignature ?? '4/4',
    sections,
    visibility: mapVisibility(dto.visibility),
    isOwner: dto.isOwner,
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
  /** 公開範囲が public な全ユーザーの曲一覧を取得する（自分の曲に限定しない）。 */
  async list(): Promise<SongListItem[]> {
    const response = await api.get<ApiSongListItemDto[]>('/songs')
    return response.map(toSongListItem)
  },

  /** 公開曲のアーティスト名一覧を登録数の多い順に取得する（入力サジェスト用）。 */
  async listArtists(): Promise<string[]> {
    return api.get<string[]>('/songs/artists')
  },

  async listDemo(): Promise<SongListItem[]> {
    const response = await api.get<ApiSongListItemDto[]>('/songs/demo')
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
      ...(visibility ? { visibility: toApiVisibility(visibility) } : {}),
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
      visibility: toApiVisibility(updates.visibility ?? 'private'),
    })
    return toSong(dto)
  },

  /** 公開範囲のみを変更する（他の編集内容には影響しない）。 */
  async updateVisibility(id: string, visibility: SongVisibility): Promise<Song> {
    if (!isAuthenticated()) {
      throw new Error('ログインが必要です')
    }
    const dto = await api.patch<ApiSongDto>(`/songs/${id}`, {
      visibility: toApiVisibility(visibility),
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
