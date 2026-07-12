import { describe, expect, it } from 'vitest'
import { detectKey } from './detectKey'

describe('detectKey', () => {
  it('メジャーキーの典型進行を推定する', () => {
    expect(detectKey(['C', 'F', 'G', 'C'])?.key).toBe('C')
    expect(detectKey(['G', 'Em', 'C', 'D', 'G'])?.key).toBe('G')
    expect(detectKey(['F', 'Bb', 'C7', 'F'])?.key).toBe('F')
  })

  it('マイナーキーの典型進行を推定する（ハーモニックの V7 を許容）', () => {
    expect(detectKey(['Am', 'Dm', 'E7', 'Am'])?.key).toBe('Am')
    expect(detectKey(['Em', 'Am', 'B7', 'Em'])?.key).toBe('Em')
  })

  it('相対調はトニックの位置で判別する', () => {
    // Am F C G: ダイアトニックは C と共通だが、先頭が Am
    expect(detectKey(['Am', 'F', 'C', 'G', 'Am'])?.key).toBe('Am')
    expect(detectKey(['C', 'Am', 'F', 'G', 'C'])?.key).toBe('C')
  })

  it('セブンス・スラッシュコード混じりでも推定できる', () => {
    expect(detectKey(['Gmaj7', 'Em7', 'Am7', 'D7', 'G'])?.key).toBe('G')
  })

  it('confidence は 0..1', () => {
    const result = detectKey(['C', 'F', 'G', 'C'])
    expect(result).not.toBeNull()
    expect(result!.confidence).toBeGreaterThan(0)
    expect(result!.confidence).toBeLessThanOrEqual(1)
  })

  it('コードが無い・解釈不能のみなら null', () => {
    expect(detectKey([])).toBeNull()
    expect(detectKey(['N.C.', '???'])).toBeNull()
  })
})
