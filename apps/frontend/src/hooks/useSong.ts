import useSWR from 'swr'
import { shareApi } from '@/lib/shareApi'
import { songApi } from '@/lib/songApi'
import { useAuthStore } from '@/stores/authStore'

// デモ一覧は匿名前提のため認証の準備を待たずに取得する。
export const useDemoSongList = () => {
  const { data, error, isLoading, mutate } = useSWR('demo/songs', () => songApi.listDemo())
  return { songs: data ?? [], error, isLoading, mutate }
}

// mode に応じて公開曲一覧／デモ一覧のどちらか一方だけを取得する。
// 公開曲一覧は投稿者に関わらず visibility=public な全曲を表示する（自分の曲に限定しない）。
export const useSongListForMode = (mode: 'default' | 'demo') => {
  const isDemo = mode === 'demo'
  const { data, error, isLoading, mutate } = useSWR(isDemo ? 'demo/songs' : 'songs', () =>
    isDemo ? songApi.listDemo() : songApi.list()
  )
  return { songs: data ?? [], error, isLoading, mutate }
}

export const useSong = (id: string | undefined) => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const { data, error, isLoading, mutate } = useSWR(isAuthReady && id ? `songs/${id}` : null, () =>
    songApi.get(id!)
  )
  return { song: data, error, isLoading: !isAuthReady || isLoading, mutate }
}

// 共有トークンで曲を取得する（認証不要・匿名アクセス前提）。
export const useSharedSong = (token: string | undefined) => {
  const { data, error, isLoading } = useSWR(token ? `shares/${token}` : null, () =>
    shareApi.resolve(token!)
  )
  return { song: data, error, isLoading }
}

export const useSongSearch = (query?: string) => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const hasQuery = !!query?.trim()
  const { data, error, isLoading } = useSWR(
    isAuthReady && hasQuery ? `songs/search?q=${query}` : null,
    () => songApi.search(query)
  )
  return { results: data ?? [], error, isLoading: !isAuthReady || isLoading }
}
