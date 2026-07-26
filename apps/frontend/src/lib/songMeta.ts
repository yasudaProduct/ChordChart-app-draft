import type { Song } from '@/types/song'

/** 譜面ヘッダーに並べるメタ情報の1項目。ラベルを持たない項目（拍子）もある。 */
export type SongMetaEntry = {
  /** 表示用のキー（React の key にも使う） */
  id: 'key' | 'bpm' | 'timeSignature'
  label?: string
  value: string
}

type SongMetaSource = Pick<Song, 'key' | 'bpm' | 'timeSignature'>

/**
 * 設定済みのメタ情報（キー・BPM・拍子）だけを表示順に返す。
 * キー・BPM・拍子はいずれも任意項目のため、未設定の項目は結果に含めない
 * （プレースホルダを出さず、項目ごと非表示にする方針）。
 */
export const songMetaEntries = (song: SongMetaSource): SongMetaEntry[] => {
  const entries: SongMetaEntry[] = []

  if (song.key) {
    entries.push({ id: 'key', label: 'Key', value: song.key })
  }
  if (song.bpm !== undefined && song.bpm !== null) {
    entries.push({ id: 'bpm', label: 'BPM', value: String(song.bpm) })
  }
  if (song.timeSignature) {
    entries.push({ id: 'timeSignature', value: song.timeSignature })
  }

  return entries
}

/**
 * 「アーティスト · Key C · BPM 120 · 4/4」形式の1行テキストを組み立てる。
 * 未設定のキー・BPM・拍子は項目ごと省略される（アーティストは未設定でも表示する）。
 */
export const songMetaLine = (song: SongMetaSource & Pick<Song, 'artist'>): string =>
  [
    song.artist || 'アーティスト未設定',
    ...songMetaEntries(song).map((entry) =>
      entry.label ? `${entry.label} ${entry.value}` : entry.value
    ),
  ].join(' · ')
