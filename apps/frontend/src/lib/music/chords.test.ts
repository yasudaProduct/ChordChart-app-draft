import { describe, expect, it } from 'vitest'
import { getChordQuality, parseChordSymbol, transposeChordSymbol } from './chords'

describe('parseChordSymbol', () => {
  it('ルート・タイプ・ベースに分解する', () => {
    expect(parseChordSymbol('C')).toEqual({ root: 'C', type: '', bass: null })
    expect(parseChordSymbol('C#m7')).toEqual({ root: 'C#', type: 'm7', bass: null })
    expect(parseChordSymbol('Bb7sus4')).toEqual({ root: 'Bb', type: '7sus4', bass: null })
    expect(parseChordSymbol('C/E')).toEqual({ root: 'C', type: '', bass: 'E' })
    expect(parseChordSymbol('Am7/G')).toEqual({ root: 'A', type: 'm7', bass: 'G' })
  })

  it('ルートが取れない表記は null', () => {
    expect(parseChordSymbol('')).toBeNull()
    expect(parseChordSymbol('   ')).toBeNull()
    expect(parseChordSymbol('N.C.')).toBeNull()
  })
})

describe('getChordQuality', () => {
  it('コードの性質を判定する', () => {
    expect(getChordQuality('C')).toBe('major')
    expect(getChordQuality('Am')).toBe('minor')
    expect(getChordQuality('Am7')).toBe('minor')
    expect(getChordQuality('Bdim')).toBe('diminished')
    expect(getChordQuality('Caug')).toBe('augmented')
    expect(getChordQuality('G7')).toBe('dominant')
  })
})

describe('transposeChordSymbol', () => {
  it('半音単位で移調する', () => {
    expect(transposeChordSymbol('C', 2)).toBe('D')
    expect(transposeChordSymbol('Am7', 2)).toBe('Bm7')
    expect(transposeChordSymbol('G7', 5)).toBe('C7')
    expect(transposeChordSymbol('F#m7b5', 1)).toBe('Gm7b5')
  })

  it('スラッシュコードのベース音も移調する', () => {
    expect(transposeChordSymbol('C/E', 2)).toBe('D/F#')
    expect(transposeChordSymbol('Am7/G', 2)).toBe('Bm7/A')
  })

  it('負の半音・12超の半音も正規化される', () => {
    expect(transposeChordSymbol('C', -1)).toBe('B')
    expect(transposeChordSymbol('F', -1)).toBe('E')
    expect(transposeChordSymbol('C', 14)).toBe('D')
    expect(transposeChordSymbol('C', 12)).toBe('C')
    expect(transposeChordSymbol('C', 0)).toBe('C')
  })

  it('useFlats 指定で綴りを制御できる', () => {
    expect(transposeChordSymbol('C', 1, { useFlats: false })).toBe('C#')
    expect(transposeChordSymbol('C', 1, { useFlats: true })).toBe('Db')
    expect(transposeChordSymbol('Bb', 2, { useFlats: false })).toBe('C')
  })

  it('useFlats 未指定時は元の臨時記号に追従する', () => {
    expect(transposeChordSymbol('Bb', 3)).toBe('Db')
    expect(transposeChordSymbol('F#', 2)).toBe('G#')
    // Cb は慣用外なので B に単純化される
    expect(transposeChordSymbol('Bb', 1)).toBe('B')
  })

  it('E#/B# 等は単純な異名同音に正規化される', () => {
    // A# +2 = B#（→ C に正規化）
    expect(transposeChordSymbol('A#', 2, { useFlats: false })).toBe('C')
    // E +1 = E#? → F
    expect(transposeChordSymbol('E', 1, { useFlats: false })).toBe('F')
  })

  it('パース不能な表記はそのまま返す', () => {
    expect(transposeChordSymbol('N.C.', 2)).toBe('N.C.')
    expect(transposeChordSymbol('???', 2)).toBe('???')
  })

  it('12種すべての移調でルートが有効な音名になる', () => {
    for (let n = 0; n < 12; n++) {
      const result = transposeChordSymbol('C', n)
      expect(result).toMatch(/^[A-G][#b]?$/)
    }
  })
})
