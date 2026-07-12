import { describe, expect, it } from 'vitest'
import { parseSectionContent, serializeSectionContent } from '@/lib/sectionContent'
import type { Song } from '@/types/song'
import { collectChordSymbols, transposeSong } from './transposeSong'

const buildSong = (key: string, chordsPerLine: string[][]): Song => ({
  id: 'song-1',
  title: 'Test Song',
  artist: 'Tester',
  key,
  bpm: 120,
  timeSignature: '4/4',
  visibility: 'private',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sections: [
    {
      id: 'section-1',
      name: 'Aメロ',
      type: 'lyrics-chord',
      content: serializeSectionContent(
        chordsPerLine.map((chords, lineIndex) => ({
          id: `line-${lineIndex}`,
          lyrics: 'テスト歌詞',
          chords: chords.map((chord, chordIndex) => ({
            id: `chord-${lineIndex}-${chordIndex}`,
            chord,
            offset: (chordIndex + 1) / (chords.length + 1),
          })),
        }))
      ),
    },
  ],
})

describe('transposeSong', () => {
  it('キーと全コードを移調する', () => {
    const song = buildSong('C', [['C', 'Am', 'F', 'G7']])
    const transposed = transposeSong(song, 2)

    expect(transposed.key).toBe('D')
    const { lines } = parseSectionContent(transposed.sections[0].content)
    expect(lines[0].chords.map((c) => c.chord)).toEqual(['D', 'Bm', 'G', 'A7'])
  })

  it('移調後のキーの調号に綴りを揃える（フラット系）', () => {
    const song = buildSong('C', [['C', 'F', 'G']])
    const transposed = transposeSong(song, 1) // C → Db（フラット系）

    expect(transposed.key).toBe('Db')
    const { lines } = parseSectionContent(transposed.sections[0].content)
    expect(lines[0].chords.map((c) => c.chord)).toEqual(['Db', 'Gb', 'Ab'])
  })

  it('元の Song を変更しない（非破壊）・ID を維持する', () => {
    const song = buildSong('C', [['C', 'G']])
    const originalContent = song.sections[0].content
    const transposed = transposeSong(song, 2)

    expect(song.sections[0].content).toBe(originalContent)
    expect(song.key).toBe('C')
    const { lines } = parseSectionContent(transposed.sections[0].content)
    expect(lines[0].id).toBe('line-0')
    expect(lines[0].chords[0].id).toBe('chord-0-0')
    expect(lines[0].lyrics).toBe('テスト歌詞')
  })

  it('0 半音（12 の倍数）は同一の Song を返す', () => {
    const song = buildSong('C', [['C']])
    expect(transposeSong(song, 0)).toBe(song)
    expect(transposeSong(song, 12)).toBe(song)
    expect(transposeSong(song, -12)).toBe(song)
  })

  it('キーが無い曲でもコードは移調される', () => {
    const song = buildSong('', [['C', 'Am']])
    const transposed = transposeSong(song, 2)
    const { lines } = parseSectionContent(transposed.sections[0].content)
    expect(lines[0].chords.map((c) => c.chord)).toEqual(['D', 'Bm'])
  })
})

describe('collectChordSymbols', () => {
  it('全セクションのコードを出現順に取り出す', () => {
    const song = buildSong('C', [
      ['C', 'Am'],
      ['F', 'G'],
    ])
    expect(collectChordSymbols(song)).toEqual(['C', 'Am', 'F', 'G'])
  })

  it('空コードは除外する', () => {
    const song = buildSong('C', [['C', '', ' ']])
    expect(collectChordSymbols(song)).toEqual(['C'])
  })
})
