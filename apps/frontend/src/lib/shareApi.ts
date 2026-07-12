import { api, getApiErrorStatus } from '@/lib/api'
import { toSong, type ApiSongDto } from '@/lib/songApi'
import type { Song } from '@/types/song'

export type ShareInfo = {
  id: string
  songId: string
  token: string
  expiresAt: string | null
  createdAt: string
}

/** 共有リンクの閲覧 URL を組み立てる。 */
export const buildShareUrl = (token: string): string => {
  if (typeof window === 'undefined') return `/share/${token}`
  return `${window.location.origin}/share/${token}`
}

export const shareApi = {
  /** 曲の有効な共有リンクを取得する。無ければ null。 */
  async get(songId: string): Promise<ShareInfo | null> {
    try {
      return await api.get<ShareInfo>(`/songs/${songId}/share`)
    } catch (error) {
      if (getApiErrorStatus(error) === 404) return null
      throw error
    }
  },

  /** 共有リンクを発行する（既に有効なリンクがあればそれが返る）。 */
  async create(songId: string, expiresInDays?: number | null): Promise<ShareInfo> {
    return api.post<ShareInfo>(`/songs/${songId}/share`, {
      expiresInDays: expiresInDays ?? null,
    })
  },

  /** 共有リンクを失効させる。 */
  async remove(songId: string): Promise<void> {
    try {
      await api.delete(`/songs/${songId}/share`)
    } catch (error) {
      // 既に失効済みなら成功扱い
      if (getApiErrorStatus(error) === 404) return
      throw error
    }
  },

  /** 共有トークンから曲を取得する（認証不要）。無効・期限切れは 404 で throw。 */
  async resolve(token: string): Promise<Song> {
    const dto = await api.get<ApiSongDto>(`/shares/${encodeURIComponent(token)}`)
    return toSong(dto)
  },
}
