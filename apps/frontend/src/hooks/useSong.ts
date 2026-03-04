import useSWR from 'swr'
import { songApi } from '@/lib/songApi'
import { useAuthStore } from '@/stores/authStore'

export const useSongList = () => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const { data, error, isLoading, mutate } = useSWR(
    isAuthReady ? 'songs' : null,
    () => songApi.list()
  )
  return { songs: data ?? [], error, isLoading: !isAuthReady || isLoading, mutate }
}

export const useSong = (id: string | undefined) => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const { data, error, isLoading, mutate } = useSWR(
    isAuthReady && id ? `songs/${id}` : null,
    () => songApi.get(id!)
  )
  return { song: data, error, isLoading: !isAuthReady || isLoading, mutate }
}

export const useSongSearch = (query?: string) => {
  const isAuthReady = !useAuthStore((s) => s.isLoading)
  const { data, error, isLoading } = useSWR(
    isAuthReady ? `songs/search?q=${query ?? ''}` : null,
    () => songApi.search(query)
  )
  return { results: data ?? [], error, isLoading: !isAuthReady || isLoading }
}
