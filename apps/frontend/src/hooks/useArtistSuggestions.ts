import useSWR from 'swr'
import { songApi } from '@/lib/songApi'

/**
 * アーティスト名のサジェスト候補（公開曲由来）を取得する。
 *
 * 候補は入力のたびに変わるものではないので一括で取得し、SWR のキャッシュを使い回す。
 * 入力中の絞り込みは `@/lib/artistName` の filterArtistSuggestions でクライアント側で行う。
 * 取得に失敗してもサジェストが出ないだけなので、エラーは呼び出し側では扱わない。
 */
export const useArtistSuggestions = () => {
  const { data } = useSWR('songs/artists', () => songApi.listArtists(), {
    // 候補の入れ替わりは緩やかなので、マウントのたびに再検証しない
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  })

  return data ?? []
}
