import { describe, expect, it } from 'vitest'
import {
  KEY_SELECT_OPTIONS,
  formatKeyName,
  getDiatonicTriads,
  getDominantSeventh,
  keyUsesFlats,
  parseKeyName,
  semitonesBetweenKeys,
  transposeKeyName,
} from './keys'

describe('parseKeyName', () => {
  it('メジャー・マイナーのキー表記を解釈する', () => {
    expect(parseKeyName('C')).toEqual({ tonic: 'C', mode: 'major' })
    expect(parseKeyName('F#m')).toEqual({ tonic: 'F#', mode: 'minor' })
    expect(parseKeyName('Bbm')).toEqual({ tonic: 'Bb', mode: 'minor' })
    expect(parseKeyName('am')).toEqual({ tonic: 'A', mode: 'minor' })
  })

  it('解釈できない表記は null', () => {
    expect(parseKeyName('')).toBeNull()
    expect(parseKeyName(null)).toBeNull()
    expect(parseKeyName('H')).toBeNull()
    expect(parseKeyName('C major')).toBeNull()
  })
})

describe('formatKeyName', () => {
  it('表記文字列に戻す', () => {
    expect(formatKeyName({ tonic: 'C', mode: 'major' })).toBe('C')
    expect(formatKeyName({ tonic: 'F#', mode: 'minor' })).toBe('F#m')
  })
})

describe('keyUsesFlats', () => {
  it('フラット系キーを判定する', () => {
    expect(keyUsesFlats({ tonic: 'F', mode: 'major' })).toBe(true)
    expect(keyUsesFlats({ tonic: 'Bb', mode: 'major' })).toBe(true)
    expect(keyUsesFlats({ tonic: 'G', mode: 'major' })).toBe(false)
    expect(keyUsesFlats({ tonic: 'C', mode: 'major' })).toBe(false)
    expect(keyUsesFlats({ tonic: 'D', mode: 'minor' })).toBe(true)
    expect(keyUsesFlats({ tonic: 'E', mode: 'minor' })).toBe(false)
  })
})

describe('transposeKeyName', () => {
  it('キーを移調し慣用表記に正規化する', () => {
    expect(transposeKeyName('C', 2)).toBe('D')
    expect(transposeKeyName('C', 1)).toBe('Db')
    expect(transposeKeyName('C', 3)).toBe('Eb')
    expect(transposeKeyName('G', -2)).toBe('F')
    expect(transposeKeyName('F#', 6)).toBe('C')
    expect(transposeKeyName('Am', 2)).toBe('Bm')
    expect(transposeKeyName('Am', 3)).toBe('Cm')
    expect(transposeKeyName('Am', -1)).toBe('G#m')
  })

  it('解釈できない表記はそのまま返す', () => {
    expect(transposeKeyName('X', 2)).toBe('X')
  })
})

describe('semitonesBetweenKeys', () => {
  it('キー間の半音差を返す', () => {
    expect(semitonesBetweenKeys('C', 'D')).toBe(2)
    expect(semitonesBetweenKeys('D', 'C')).toBe(10)
    expect(semitonesBetweenKeys('C', 'C')).toBe(0)
    expect(semitonesBetweenKeys('Am', 'Bm')).toBe(2)
  })

  it('解釈不能なら null', () => {
    expect(semitonesBetweenKeys('X', 'C')).toBeNull()
  })
})

describe('getDiatonicTriads / getDominantSeventh', () => {
  it('メジャーキーのダイアトニックトライアド', () => {
    expect(getDiatonicTriads({ tonic: 'G', mode: 'major' })).toEqual([
      'G',
      'Am',
      'Bm',
      'C',
      'D',
      'Em',
      'F#dim',
    ])
  })

  it('マイナーキーはナチュラルマイナー基準', () => {
    expect(getDiatonicTriads({ tonic: 'A', mode: 'minor' })).toEqual([
      'Am',
      'Bdim',
      'C',
      'Dm',
      'Em',
      'F',
      'G',
    ])
  })

  it('ドミナント7th（マイナーはハーモニック由来）', () => {
    expect(getDominantSeventh({ tonic: 'G', mode: 'major' })).toBe('D7')
    expect(getDominantSeventh({ tonic: 'A', mode: 'minor' })).toBe('E7')
  })
})

describe('KEY_SELECT_OPTIONS', () => {
  it('メジャー12 + マイナー12 の24キー', () => {
    expect(KEY_SELECT_OPTIONS).toHaveLength(24)
    expect(KEY_SELECT_OPTIONS).toContain('C')
    expect(KEY_SELECT_OPTIONS).toContain('F#')
    expect(KEY_SELECT_OPTIONS).toContain('Am')
    expect(KEY_SELECT_OPTIONS).toContain('Bbm')
  })
})
