import useSWR from 'swr'
import { songApi } from '@/lib/songApi'
import { demoSongStorage } from '@/lib/demoSongStorage'

export const useDemoSong = (id: string | undefined) => {
  const { data, error, isLoading } = useSWR(id ? `demo/songs/${id}` : null, async () => {
    const local = demoSongStorage.get(id!)
    if (local) return local
    return songApi.get(id!)
  })
  return { song: data, error, isLoading }
}
