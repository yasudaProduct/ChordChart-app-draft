import { describe, expect, it } from 'vitest'
import {
  getDiatonicSuggestions,
  getNextChordSuggestions,
  getSubstituteSuggestions,
} from './suggest'

describe('getDiatonicSuggestions', () => {
  it('キーのダイアトニックトライアド + V7 を返す', () => {
    const suggestions = getDiatonicSuggestions('G')
    expect(suggestions).toContain('G')
    expect(suggestions).toContain('Em')
    expect(suggestions).toContain('F#dim')
    expect(suggestions).toContain('D7')
  })

  it('マイナーキーにも対応する', () => {
    const suggestions = getDiatonicSuggestions('Am')
    expect(suggestions).toContain('Am')
    expect(suggestions).toContain('Dm')
    expect(suggestions).toContain('E7')
  })

  it('キー不明なら空配列', () => {
    expect(getDiatonicSuggestions('')).toEqual([])
    expect(getDiatonicSuggestions(undefined)).toEqual([])
  })
})

describe('getNextChordSuggestions', () => {
  it('V → I を含む定石を提案する', () => {
    const afterG = getNextChordSuggestions('C', 'G')
    expect(afterG).toContain('C')
    expect(afterG).toContain('Am')
  })

  it('I → IV/V/vi を提案する', () => {
    const afterC = getNextChordSuggestions('C', 'C')
    expect(afterC).toContain('F')
    expect(afterC).toContain('G')
    expect(afterC).toContain('Am')
    // V を含むので V7 も添えられる
    expect(afterC).toContain('G7')
  })

  it('セブンス表記の直前コードでも度数を判定できる', () => {
    const afterDm7 = getNextChordSuggestions('C', 'Dm7')
    expect(afterDm7).toContain('G')
  })

  it('マイナーキーの V はメジャートライアドで提示する', () => {
    const afterDm = getNextChordSuggestions('Am', 'Dm')
    expect(afterDm).toContain('E')
    expect(afterDm).toContain('E7')
  })

  it('キー不明・直前コード無し・ダイアトニック外は空配列', () => {
    expect(getNextChordSuggestions(undefined, 'C')).toEqual([])
    expect(getNextChordSuggestions('C', null)).toEqual([])
    expect(getNextChordSuggestions('C', 'F#')).toEqual([])
  })
})

describe('getSubstituteSuggestions', () => {
  it('I の代理（vi, iii）を提案する', () => {
    const subs = getSubstituteSuggestions('C', 'C')
    expect(subs).toContain('Am')
    expect(subs).toContain('Em')
    expect(subs).not.toContain('C')
  })

  it('V にはトライトーン代理（bII7）を含める', () => {
    const subs = getSubstituteSuggestions('C', 'G')
    expect(subs).toContain('Db7')
  })

  it('キー不明・入力なしは空配列', () => {
    expect(getSubstituteSuggestions('C', '')).toEqual([])
    expect(getSubstituteSuggestions(undefined, 'C')).toEqual([])
  })
})
