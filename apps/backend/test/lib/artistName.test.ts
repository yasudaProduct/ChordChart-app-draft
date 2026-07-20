import { describe, it, expect } from 'vitest'
import { aggregateArtistNames, normalizeArtistKey } from '../../src/lib/artistName'

describe('normalizeArtistKey', () => {
  it('大文字小文字を無視する', () => {
    expect(normalizeArtistKey('Mr.Children')).toBe(normalizeArtistKey('MR.CHILDREN'))
  })

  it('全角の英数字・記号を半角に寄せる', () => {
    expect(normalizeArtistKey('ＹＯＡＳＯＢＩ')).toBe('yoasobi')
    expect(normalizeArtistKey('Ｍｒ．Ｃｈｉｌｄｒｅｎ')).toBe('mr.children')
  })

  it('前後の空白を除去し、連続する空白を1つに畳む', () => {
    expect(normalizeArtistKey('  king   gnu  ')).toBe('king gnu')
  })

  it('全角スペースも半角スペースとして扱う', () => {
    expect(normalizeArtistKey('King　Gnu')).toBe('king gnu')
  })

  it('半角カナは全角カナに正規化される', () => {
    expect(normalizeArtistKey('ｱｼﾞｱﾝｶﾝﾌｰｼﾞｪﾈﾚｰｼｮﾝ')).toBe('アジアンカンフージェネレーション')
  })
})

describe('aggregateArtistNames', () => {
  it('登録数の多い順に返す', () => {
    const result = aggregateArtistNames(['B', 'A', 'B', 'C', 'B', 'A'], 10)
    expect(result).toEqual(['B', 'A', 'C'])
  })

  it('表記ゆれを1つにまとめ、最も多い表記を代表にする', () => {
    const result = aggregateArtistNames(['YOASOBI', 'ＹＯＡＳＯＢＩ', 'YOASOBI', 'yoasobi'], 10)
    expect(result).toEqual(['YOASOBI'])
  })

  it('null と空白のみの名前は無視する', () => {
    const result = aggregateArtistNames([null, '', '   ', 'あいみょん'], 10)
    expect(result).toEqual(['あいみょん'])
  })

  it('代表の表記は前後の空白を落として返す', () => {
    const result = aggregateArtistNames(['  King Gnu  '], 10)
    expect(result).toEqual(['King Gnu'])
  })

  it('登録数が同じときは先に現れたものを優先する', () => {
    const result = aggregateArtistNames(['A', 'B', 'C'], 10)
    expect(result).toEqual(['A', 'B', 'C'])
  })

  it('limit 件までに切り詰める', () => {
    const result = aggregateArtistNames(['A', 'B', 'C', 'D'], 2)
    expect(result).toEqual(['A', 'B'])
  })

  it('空配列なら空配列を返す', () => {
    expect(aggregateArtistNames([], 10)).toEqual([])
  })
})
