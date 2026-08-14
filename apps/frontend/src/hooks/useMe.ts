import useSWR from 'swr'
import { meApi } from '@/lib/meApi'
import { useAuthStore } from '@/stores/authStore'

export const useMySummary = () => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)
  const { data, error, isLoading, mutate } = useSWR(isAuthReady && user ? 'me/summary' : null, () =>
    meApi.getSummary()
  )
  return { summary: data, error, isLoading: !isAuthReady || isLoading, mutate }
}

export const useMyRecentSongs = (limit = 5) => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)
  const { data, error, isLoading, mutate } = useSWR(
    isAuthReady && user ? `me/songs?limit=${limit}` : null,
    () => meApi.listMySongs(limit)
  )
  return { songs: data ?? [], error, isLoading: !isAuthReady || isLoading, mutate }
}

export const useMySongs = () => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)
  const { data, error, isLoading, mutate } = useSWR(isAuthReady && user ? 'me/songs' : null, () =>
    meApi.listMySongs()
  )
  return { songs: data ?? [], error, isLoading: !isAuthReady || isLoading, mutate }
}
