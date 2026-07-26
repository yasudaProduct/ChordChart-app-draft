import { parseSectionContent, serializeSectionContent } from '@/lib/sectionContent'
import { resolveSectionMetas } from '@/lib/sectionMeta'
import type { Song } from '@/types/song'
import { normalizeSemitones, transposeChordSymbol } from './chords'
import { keyUsesFlats, parseKeyName, transposeKeyName } from './keys'

/**
 * 曲全体（楽曲キー・セクションキー + 全セクションのコード）を半音単位で移調した
 * 新しい Song を返す。
 * 非破壊（元の Song は変更しない）。ID は維持するため React の描画キーも安定する。
 *
 * 綴りは移調後のキーの調号（♯/♭）に揃える。転調するセクションでは表記が変わるため、
 * 曲全体ではなく「そのセクションの移調後の有効キー」を基準にする。
 * キーが不明な場合は各コードの元表記に追従する。
 *
 * BPM・拍子は移調の影響を受けないのでそのまま維持する。
 */
export const transposeSong = (song: Song, semitones: number): Song => {
  if (normalizeSemitones(semitones) === 0) return song

  const nextKey = song.key ? transposeKeyName(song.key, semitones) : song.key
  // 移調“前”の有効キーを解決しておく（明示していないセクションの綴り基準になる）
  const metas = resolveSectionMetas(song)

  const sections = song.sections.map((section, index) => {
    // 明示されたセクションキーだけを移調する。未設定なら未設定のまま＝継承を維持
    const nextSectionKey = section.key ? transposeKeyName(section.key, semitones) : section.key

    const effectiveKey = metas[index].effective.key
    const nextEffectiveKey = effectiveKey ? transposeKeyName(effectiveKey, semitones) : undefined
    const parsedEffectiveKey = parseKeyName(nextEffectiveKey)
    const options = parsedEffectiveKey ? { useFlats: keyUsesFlats(parsedEffectiveKey) } : undefined

    const { lines } = parseSectionContent(section.content)
    const transposedLines = lines.map((line) => ({
      ...line,
      chords: line.chords.map((chord) => ({
        ...chord,
        chord: transposeChordSymbol(chord.chord, semitones, options),
      })),
    }))
    return {
      ...section,
      key: nextSectionKey,
      content: serializeSectionContent(transposedLines),
    }
  })

  return { ...song, key: nextKey, sections }
}

/** 曲に含まれる全コード記号を出現順に取り出す（キー推定などに使う）。 */
export const collectChordSymbols = (song: Song): string[] => {
  const symbols: string[] = []
  for (const section of song.sections) {
    const { lines } = parseSectionContent(section.content)
    for (const line of lines) {
      for (const chord of line.chords) {
        if (chord.chord.trim()) symbols.push(chord.chord)
      }
    }
  }
  return symbols
}
