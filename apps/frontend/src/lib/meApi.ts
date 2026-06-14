import { api } from '@/lib/api'
import type { SongListItem } from '@/types/song'

export type MySongSummary = {
  total: number
  private: number
  urlOnly: number
  specificUsers: number
  public: number
}

type ApiSongListItemDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  updatedAt: string
}

const toSongListItem = (dto: ApiSongListItemDto): SongListItem => ({
  id: dto.id,
  title: dto.title,
  artist: dto.artist ?? '',
  key: dto.key ?? '',
  updatedAt: dto.updatedAt,
})

export const meApi = {
  async getSummary(): Promise<MySongSummary> {
    return api.get<MySongSummary>('/me/summary')
  },

  async listMySongs(limit?: number): Promise<SongListItem[]> {
    const params = limit ? `?limit=${limit}` : ''
    const response = await api.get<ApiSongListItemDto[]>(`/me/songs${params}`)
    return response.map(toSongListItem)
  },
}
