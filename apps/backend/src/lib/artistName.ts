/**
 * アーティスト名の集計ユーティリティ（サジェスト用）。
 *
 * 同じアーティストでも「Mr.Children」「ＭＲ．ＣＨＩＬＤＲＥＮ」「mr. children」のように
 * 表記がゆれるため、比較用のキーに正規化したうえで重複を排除する。
 * フロントエンドの絞り込み（apps/frontend/src/lib/artistName.ts）と
 * 同じキーの作り方を使うこと。
 */

/**
 * 比較用のキーを作る。
 * - NFKC で全角の英数字・記号・スペースを半角へ寄せる
 * - 前後の空白を除去し、連続する空白を 1 つに畳む
 * - 大文字小文字を無視する
 */
export const normalizeArtistKey = (name: string): string =>
  name.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase()

/** 表示用に前後の空白を除去し、連続する空白を 1 つに畳む（表記自体は変換しない）。 */
const toDisplayName = (name: string): string => name.replace(/\s+/g, ' ').trim()

type ArtistGroup = {
  /** このグループに属する曲数 */
  total: number
  /** 表記ごとの出現回数（挿入順を保つ） */
  variants: Map<string, number>
  /** 最初に現れた順序（同数のときの安定した並び順に使う） */
  order: number
}

/** グループ内で最も多く使われている表記を代表として選ぶ（同数なら先に現れたもの）。 */
const pickDisplayName = (group: ArtistGroup): string => {
  let best = ''
  let bestCount = -1

  for (const [name, count] of group.variants) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }

  return best
}

/**
 * アーティスト名を正規化キーで重複排除し、登録数の多い順に返す。
 *
 * @param names 生のアーティスト名（null・空文字は無視する）
 * @param limit 返す最大件数
 */
export const aggregateArtistNames = (names: (string | null)[], limit: number): string[] => {
  const groups = new Map<string, ArtistGroup>()

  for (const raw of names) {
    if (raw === null) continue

    const display = toDisplayName(raw)
    if (display === '') continue

    const key = normalizeArtistKey(display)
    let group = groups.get(key)
    if (!group) {
      group = { total: 0, variants: new Map(), order: groups.size }
      groups.set(key, group)
    }

    group.total += 1
    group.variants.set(display, (group.variants.get(display) ?? 0) + 1)
  }

  return [...groups.values()]
    .sort((a, b) => b.total - a.total || a.order - b.order)
    .slice(0, limit)
    .map(pickDisplayName)
}
