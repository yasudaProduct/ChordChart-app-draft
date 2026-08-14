import { describe, expect, it } from 'vitest'
import { parseSectionContent } from './sectionContent'
import { parseSongContent } from './parseSongContent'

describe('parseSongContent', () => {
  it('現行形式（{sections:[]}）を読み込む', () => {
    const sections = parseSongContent(
      JSON.stringify({
        sections: [
          { id: 's1', name: 'Aメロ', type: 'lyrics-chord', content: '{"lines":[]}' },
          { id: 's2', name: 'サビ', type: 'chord-only', content: '{"lines":[]}' },
        ],
      })
    )

    expect(sections.map((s) => [s.id, s.name, s.type])).toEqual([
      ['s1', 'Aメロ', 'lyrics-chord'],
      ['s2', 'サビ', 'chord-only'],
    ])
  })

  it('空・不正な JSON は空配列', () => {
    expect(parseSongContent(null)).toEqual([])
    expect(parseSongContent(undefined)).toEqual([])
    expect(parseSongContent('')).toEqual([])
    expect(parseSongContent('not json')).toEqual([])
    expect(parseSongContent('{}')).toEqual([])
    expect(parseSongContent('[]')).toEqual([])
  })

  it('レガシー形式（トップレベル配列 + lines 直下）を変換する', () => {
    const sections = parseSongContent([
      {
        id: 's1',
        name: 'Aメロ',
        lines: [{ lyrics: 'きょうも', chords: [{ chord: 'C', offset: 0.2 }] }],
      },
    ])

    expect(sections[0].type).toBe('lyrics-chord')
    const { lines } = parseSectionContent(sections[0].content)
    expect(lines[0].lyrics).toBe('きょうも')
    expect(lines[0].chords[0].chord).toBe('C')
  })

  it('レガシー形式（bars）を変換する', () => {
    const sections = parseSongContent([
      { id: 's1', name: 'イントロ', bars: [{ chords: ['C', 'G'] }] },
    ])

    expect(sections[0].type).toBe('chord-only')
    const { lines } = parseSectionContent(sections[0].content)
    expect(lines[0].chords.map((c) => c.chord)).toEqual(['C', 'G'])
  })
})

describe('parseSongContent — セクション単位のキー・BPM・拍子', () => {
  it('現行形式でメタ情報が往復する', () => {
    const sections = parseSongContent(
      JSON.stringify({
        sections: [
          {
            id: 's1',
            name: 'サビ',
            type: 'lyrics-chord',
            content: '{"lines":[]}',
            key: 'Am',
            bpm: 90,
            timeSignature: '6/8',
          },
        ],
      })
    )

    expect(sections[0].key).toBe('Am')
    expect(sections[0].bpm).toBe(90)
    expect(sections[0].timeSignature).toBe('6/8')
  })

  it('レガシー形式（lines 直下）でもメタ情報が保持される', () => {
    const sections = parseSongContent([
      {
        id: 's1',
        name: 'サビ',
        lines: [{ lyrics: 'あ', chords: [] }],
        key: 'Am',
        bpm: 90,
        timeSignature: '6/8',
      },
    ])

    expect(sections[0].key).toBe('Am')
    expect(sections[0].bpm).toBe(90)
    expect(sections[0].timeSignature).toBe('6/8')
  })

  it('メタ情報を持たない既存データは全て未設定になる（後方互換）', () => {
    const sections = parseSongContent(
      JSON.stringify({
        sections: [{ id: 's1', name: 'Aメロ', type: 'lyrics-chord', content: '{"lines":[]}' }],
      })
    )

    expect(sections[0].key).toBeUndefined()
    expect(sections[0].bpm).toBeUndefined()
    expect(sections[0].timeSignature).toBeUndefined()
  })

  const parseMeta = (raw: Record<string, unknown>) =>
    parseSongContent(
      JSON.stringify({
        sections: [
          { id: 's1', name: 'Aメロ', type: 'lyrics-chord', content: '{"lines":[]}', ...raw },
        ],
      })
    )[0]

  it('BPM は数値文字列を受け入れ、不正値・範囲外は落とす', () => {
    expect(parseMeta({ bpm: '120' }).bpm).toBe(120)
    expect(parseMeta({ bpm: 120.6 }).bpm).toBe(121)
    expect(parseMeta({ bpm: 'abc' }).bpm).toBeUndefined()
    expect(parseMeta({ bpm: 0 }).bpm).toBeUndefined()
    expect(parseMeta({ bpm: -5 }).bpm).toBeUndefined()
    expect(parseMeta({ bpm: 1200 }).bpm).toBeUndefined()
    expect(parseMeta({ bpm: null }).bpm).toBeUndefined()
  })

  it('キーは空文字・空白のみ・非文字列を落とし、前後の空白は除く', () => {
    expect(parseMeta({ key: '' }).key).toBeUndefined()
    expect(parseMeta({ key: '   ' }).key).toBeUndefined()
    expect(parseMeta({ key: 42 }).key).toBeUndefined()
    expect(parseMeta({ key: ' Am ' }).key).toBe('Am')
  })

  it('拍子は空文字と長すぎる値を落とし、変拍子は保持する', () => {
    expect(parseMeta({ timeSignature: '' }).timeSignature).toBeUndefined()
    expect(parseMeta({ timeSignature: '12345678901' }).timeSignature).toBeUndefined()
    expect(parseMeta({ timeSignature: '5/4' }).timeSignature).toBe('5/4')
  })
})
