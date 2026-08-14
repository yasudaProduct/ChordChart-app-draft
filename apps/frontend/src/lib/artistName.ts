/**
 * アーティスト名サジェストの絞り込みユーティリティ。
 *
 * 候補は `GET /api/songs/artists` で一括取得し、入力中の絞り込みはここで行う。
 * 比較キーの作り方はバックエンド（apps/backend/src/lib/artistName.ts）と揃えること。
 */

/** サジェストに表示する既定の最大件数。 */
export const ARTIST_SUGGESTION_LIMIT = 8

/**
 * 比較用のキーを作る。
 * - NFKC で全角の英数字・記号・スペースを半角へ寄せる
 * - 前後の空白を除去し、連続する空白を 1 つに畳む
 * - 大文字小文字を無視する
 */
export const normalizeArtistKey = (name: string): string =>
  name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * 入力値に一致する候補を返す。
 * - 入力が空なら候補の先頭から limit 件（API が登録数の多い順に返す）
 * - 前方一致を部分一致より優先する
 * - 入力値と完全に一致する候補は、選んでも何も変わらないので除外する
 */
export const filterArtistSuggestions = (
  candidates: string[],
  query: string,
  limit: number = ARTIST_SUGGESTION_LIMIT
): string[] => {
  const key = normalizeArtistKey(query)
  if (key === '') return candidates.slice(0, limit)

  const prefixMatches: string[] = []
  const partialMatches: string[] = []

  for (const candidate of candidates) {
    const candidateKey = normalizeArtistKey(candidate)
    if (candidateKey === key) continue

    if (candidateKey.startsWith(key)) {
      prefixMatches.push(candidate)
      // 前方一致だけで上限に達したら、部分一致は表示されないので走査を打ち切る
      if (prefixMatches.length >= limit) break
    } else if (candidateKey.includes(key)) {
      partialMatches.push(candidate)
    }
  }

  return [...prefixMatches, ...partialMatches].slice(0, limit)
}
