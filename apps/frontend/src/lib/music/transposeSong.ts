import { parseSectionContent, serializeSectionContent } from '@/lib/sectionContent'
import type { Song } from '@/types/song'
import { normalizeSemitones, transposeChordSymbol } from './chords'
import { keyUsesFlats, parseKeyName, transposeKeyName } from './keys'

/**
 * 曲全体（キー + 全セクションのコード）を半音単位で移調した新しい Song を返す。
 * 非破壊（元の Song は変更しない）。ID は維持するため React の描画キーも安定する。
 * 綴りは移調後のキーの調号（♯/♭）に揃える。キーが不明な場合は各コードの元表記に追従する。
 */
export const transposeSong = (song: Song, semitones: number): Song => {
  if (normalizeSemitones(semitones) === 0) return song

  const nextKey = song.key ? transposeKeyName(song.key, semitones) : song.key
  const parsedNextKey = parseKeyName(nextKey)
  const options = parsedNextKey ? { useFlats: keyUsesFlats(parsedNextKey) } : undefined

  const sections = song.sections.map((section) => {
    const { lines } = parseSectionContent(section.content)
    const transposedLines = lines.map((line) => ({
      ...line,
      chords: line.chords.map((chord) => ({
        ...chord,
        chord: transposeChordSymbol(chord.chord, semitones, options),
      })),
    }))
    return { ...section, content: serializeSectionContent(transposedLines) }
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
