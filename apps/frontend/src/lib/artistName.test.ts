import { describe, it, expect } from 'vitest'
import { filterArtistSuggestions, normalizeArtistKey } from '@/lib/artistName'

describe('normalizeArtistKey', () => {
  it('大文字小文字を無視する', () => {
    expect(normalizeArtistKey('Mr.Children')).toBe(normalizeArtistKey('MR.CHILDREN'))
  })

  it('全角の英数字・記号を半角に寄せる', () => {
    expect(normalizeArtistKey('ＹＯＡＳＯＢＩ')).toBe('yoasobi')
  })

  it('全角スペースも半角スペースとして扱い、連続する空白を1つに畳む', () => {
    expect(normalizeArtistKey('  King　　Gnu  ')).toBe('king gnu')
  })
})

describe('filterArtistSuggestions', () => {
  const candidates = ['YOASOBI', 'King Gnu', 'あいみょん', 'Official髭男dism', 'Aimer']

  it('入力が空なら先頭から limit 件を返す', () => {
    expect(filterArtistSuggestions(candidates, '', 3)).toEqual([
      'YOASOBI',
      'King Gnu',
      'あいみょん',
    ])
  })

  it('空白のみの入力は空入力として扱う', () => {
    expect(filterArtistSuggestions(candidates, '   ', 2)).toEqual(['YOASOBI', 'King Gnu'])
  })

  it('大文字小文字を無視して絞り込む', () => {
    expect(filterArtistSuggestions(candidates, 'king')).toEqual(['King Gnu'])
  })

  it('全角入力でも半角の候補に一致する', () => {
    expect(filterArtistSuggestions(candidates, 'ｙｏａ')).toEqual(['YOASOBI'])
  })

  it('前方一致を部分一致より優先する', () => {
    expect(filterArtistSuggestions(['Daichi Miura', 'Aimer'], 'ai')).toEqual([
      'Aimer',
      'Daichi Miura',
    ])
  })

  it('入力値と完全に一致する候補は除外する', () => {
    expect(filterArtistSuggestions(candidates, 'ＹＯＡＳＯＢＩ')).toEqual([])
  })

  it('一致する候補がなければ空配列を返す', () => {
    expect(filterArtistSuggestions(candidates, 'zzz')).toEqual([])
  })

  it('limit 件までに切り詰める', () => {
    expect(filterArtistSuggestions(['a1', 'a2', 'a3'], 'a', 2)).toEqual(['a1', 'a2'])
  })
})
