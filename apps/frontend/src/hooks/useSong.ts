import useSWR from 'swr'
import { songApi } from '@/lib/songApi'
import { useAuthStore } from '@/stores/authStore'

export const useSongList = () => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const { data, error, isLoading, mutate } = useSWR(isAuthReady ? 'songs' : null, () =>
    songApi.list()
  )
  return { songs: data ?? [], error, isLoading: !isAuthReady || isLoading, mutate }
}

// デモ一覧は匿名前提のため認証の準備を待たずに取得する。
export const useDemoSongList = () => {
  const { data, error, isLoading, mutate } = useSWR('demo/songs', () => songApi.listDemo())
  return { songs: data ?? [], error, isLoading, mutate }
}

// mode に応じて通常一覧／デモ一覧のどちらか一方だけを取得する。
// （Rules of Hooks を満たすため両方のフックを常に呼び、片方を null キーで無効化する）
export const useSongListForMode = (mode: 'default' | 'demo') => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const isDemo = mode === 'demo'

  const normal = useSWR(!isDemo && isAuthReady ? 'songs' : null, () => songApi.list())
  const demo = useSWR(isDemo ? 'demo/songs' : null, () => songApi.listDemo())

  const active = isDemo ? demo : normal
  return {
    songs: active.data ?? [],
    error: active.error,
    isLoading: isDemo ? active.isLoading : !isAuthReady || active.isLoading,
    mutate: active.mutate,
  }
}

export const useSong = (id: string | undefined) => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const { data, error, isLoading, mutate } = useSWR(isAuthReady && id ? `songs/${id}` : null, () =>
    songApi.get(id!)
  )
  return { song: data, error, isLoading: !isAuthReady || isLoading, mutate }
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
