import useSWR from 'swr'
import { meApi } from '@/lib/meApi'
import { shareApi } from '@/lib/shareApi'
import { songApi } from '@/lib/songApi'
import { useAuthStore } from '@/stores/authStore'

// デモ一覧は匿名前提のため認証の準備を待たずに取得する。
export const useDemoSongList = () => {
  const { data, error, isLoading, mutate } = useSWR('demo/songs', () => songApi.listDemo())
  return { songs: data ?? [], error, isLoading, mutate }
}

// mode に応じてマイライブラリ／デモ一覧のどちらか一方だけを取得する。
// マイライブラリは公開範囲に関わらず自分の全曲を表示する（/api/me/songs）。
// （Rules of Hooks を満たすため両方のフックを常に呼び、片方を null キーで無効化する）
export const useSongListForMode = (mode: 'default' | 'demo') => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)
  const isDemo = mode === 'demo'

  const mine = useSWR(!isDemo && isAuthReady && user ? 'me/songs' : null, () => meApi.listMySongs())
  const demo = useSWR(isDemo ? 'demo/songs' : null, () => songApi.listDemo())

  const active = isDemo ? demo : mine
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
