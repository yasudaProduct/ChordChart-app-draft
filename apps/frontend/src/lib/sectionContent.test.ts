import { describe, expect, it } from 'vitest'
import {
  findPreviousChord,
  parseSectionContent,
  serializeSectionContent,
  type SectionLine,
} from './sectionContent'
import type { Section } from '@/types/song'

const buildSection = (id: string, lines: SectionLine[]): Section => ({
  id,
  name: 'Section',
  type: 'lyrics-chord',
  content: serializeSectionContent(lines),
})

const line = (id: string, chords: Array<{ id: string; chord: string; offset: number }>) => ({
  id,
  lyrics: '',
  chords,
})

describe('parseSectionContent / serializeSectionContent', () => {
  it('ラウンドトリップで内容が保持される', () => {
    const lines: SectionLine[] = [
      line('l1', [
        { id: 'c1', chord: 'C', offset: 0.1 },
        { id: 'c2', chord: 'G', offset: 0.6 },
      ]),
    ]
    const serialized = serializeSectionContent(lines)
    expect(parseSectionContent(serialized).lines).toEqual(lines)
  })

  it('不正な JSON は空の lines を返す', () => {
    expect(parseSectionContent('not-json').lines).toEqual([])
    expect(parseSectionContent(undefined).lines).toEqual([])
  })
})

describe('findPreviousChord', () => {
  const sections: Section[] = [
    buildSection('s1', [
      line('s1l1', [
        { id: 'a', chord: 'C', offset: 0.1 },
        { id: 'b', chord: 'G', offset: 0.5 },
      ]),
    ]),
    buildSection('s2', [
      line('s2l1', [{ id: 'c', chord: 'Am', offset: 0.3 }]),
      line('s2l2', [{ id: 'd', chord: 'F', offset: 0.4 }]),
    ]),
  ]

  it('同じ行の左側の直近コードを返す', () => {
    expect(findPreviousChord(sections, { sectionId: 's1', lineId: 's1l1', offset: 0.6 })).toBe('G')
    expect(findPreviousChord(sections, { sectionId: 's1', lineId: 's1l1', offset: 0.3 })).toBe('C')
  })

  it('行頭なら前の行・前のセクションを遡る', () => {
    // s2 の 2 行目の先頭 → 1 行目の Am
    expect(findPreviousChord(sections, { sectionId: 's2', lineId: 's2l2', offset: 0.1 })).toBe('Am')
    // s2 の 1 行目の先頭 → s1 の最後の G
    expect(findPreviousChord(sections, { sectionId: 's2', lineId: 's2l1', offset: 0.1 })).toBe('G')
  })

  it('編集中のコード自身は除外する', () => {
    expect(
      findPreviousChord(sections, { sectionId: 's1', lineId: 's1l1', offset: 0.5, chordId: 'b' })
    ).toBe('C')
  })

  it('先頭位置で直前が無ければ null', () => {
    expect(
      findPreviousChord(sections, { sectionId: 's1', lineId: 's1l1', offset: 0.05 })
    ).toBeNull()
  })

  it('存在しないセクション・行は null', () => {
    expect(findPreviousChord(sections, { sectionId: 'x', lineId: 's1l1', offset: 0.5 })).toBeNull()
    expect(findPreviousChord(sections, { sectionId: 's1', lineId: 'x', offset: 0.5 })).toBeNull()
  })
})
