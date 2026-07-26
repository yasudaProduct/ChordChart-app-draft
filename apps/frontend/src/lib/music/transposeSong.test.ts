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

describe('transposeSong — セクション単位のキー', () => {
  /** 2セクションの曲。それぞれ同じコード進行を持たせて綴りの違いを比較しやすくする。 */
  const buildTwoSectionSong = (songKey: string, sectionKeys: Array<string | undefined>): Song => ({
    ...buildSong(songKey, [['E']]),
    sections: sectionKeys.map((key, index) => ({
      id: `section-${index}`,
      name: `セクション${index}`,
      type: 'chord-only' as const,
      key,
      content: serializeSectionContent([
        {
          id: `line-${index}`,
          lyrics: '',
          chords: [{ id: `chord-${index}`, chord: 'E', offset: 0.5 }],
        },
      ]),
    })),
  })

  it('明示されたセクションキーも移調する', () => {
    const song = buildTwoSectionSong('C', ['Am', undefined])
    const transposed = transposeSong(song, 2)

    expect(transposed.key).toBe('D')
    expect(transposed.sections[0].key).toBe('Bm')
  })

  it('未設定のセクションキーは未設定のまま（継承が壊れない）', () => {
    const song = buildTwoSectionSong('C', ['Am', undefined])
    const transposed = transposeSong(song, 2)

    expect(transposed.sections[1].key).toBeUndefined()
  })

  it('コードの綴りはセクションごとの移調後の有効キーに合わせる', () => {
    // セクション0: 楽曲キー C を継承 → +2 で D（シャープ系）
    // セクション1: Eb を明示     → +2 で F（フラット系）
    const song = buildTwoSectionSong('C', [undefined, 'Eb'])
    const transposed = transposeSong(song, 2)

    const chordOf = (index: number) =>
      parseSectionContent(transposed.sections[index].content).lines[0].chords[0].chord

    expect(chordOf(0)).toBe('F#')
    expect(chordOf(1)).toBe('Gb')
  })

  it('BPM・拍子は移調の影響を受けない', () => {
    const song = buildTwoSectionSong('C', [undefined, undefined])
    song.sections[0].bpm = 90
    song.sections[0].timeSignature = '6/8'
    const transposed = transposeSong(song, 2)

    expect(transposed.sections[0].bpm).toBe(90)
    expect(transposed.sections[0].timeSignature).toBe('6/8')
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
