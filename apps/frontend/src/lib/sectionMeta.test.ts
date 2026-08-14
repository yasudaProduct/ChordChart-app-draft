import { describe, expect, it } from 'vitest'
import type { MusicMeta, Section } from '@/types/song'
import { resolveSectionMetaById, resolveSectionMetas, sectionMetaLabel } from './sectionMeta'

const section = (name: string, meta: MusicMeta = {}): Section => ({
  id: `section-${name}`,
  name,
  type: 'lyrics-chord',
  content: '{"lines":[]}',
  ...meta,
})

describe('resolveSectionMetas', () => {
  it('未設定のセクションは直前のセクションから引き継ぐ（carry-forward）', () => {
    const metas = resolveSectionMetas({
      key: 'C',
      sections: [
        section('Intro'),
        section('Aメロ'),
        section('サビ', { key: 'Am' }),
        section('Cメロ'),
        section('大サビ', { key: 'C' }),
      ],
    })

    expect(metas.map((m) => m.effective.key)).toEqual(['C', 'C', 'Am', 'Am', 'C'])
  })

  it('フィールドごとに独立して引き継ぐ（BPM だけ設定してもキーは維持される）', () => {
    const metas = resolveSectionMetas({
      key: 'C',
      bpm: 120,
      sections: [section('Aメロ', { key: 'Am' }), section('間奏', { bpm: 90 }), section('サビ')],
    })

    expect(metas.map((m) => m.effective)).toEqual([
      { key: 'Am', bpm: 120, timeSignature: undefined },
      { key: 'Am', bpm: 90, timeSignature: undefined },
      { key: 'Am', bpm: 90, timeSignature: undefined },
    ])
  })

  it('セクションが何も設定していなければ楽曲全体の値になる', () => {
    const metas = resolveSectionMetas({
      key: 'G',
      bpm: 140,
      timeSignature: '3/4',
      sections: [section('Aメロ')],
    })

    expect(metas[0].effective).toEqual({ key: 'G', bpm: 140, timeSignature: '3/4' })
    expect(metas[0].explicit).toEqual({ key: undefined, bpm: undefined, timeSignature: undefined })
  })

  it('楽曲・セクションとも未設定なら undefined のまま', () => {
    const metas = resolveSectionMetas({ sections: [section('Aメロ')] })

    expect(metas[0].effective).toEqual({
      key: undefined,
      bpm: undefined,
      timeSignature: undefined,
    })
  })

  it('空文字・0・NaN は未設定として扱う', () => {
    const metas = resolveSectionMetas({
      key: 'C',
      bpm: 120,
      timeSignature: '4/4',
      sections: [section('Aメロ', { key: '', bpm: 0, timeSignature: '   ' })],
    })

    // いずれも継承値が残る（空文字で楽曲の値を潰さない）
    expect(metas[0].effective).toEqual({ key: 'C', bpm: 120, timeSignature: '4/4' })
    expect(metas[0].explicit.key).toBeUndefined()
    expect(metas[0].explicit.bpm).toBeUndefined()
    expect(metas[0].explicit.timeSignature).toBeUndefined()
  })

  it('inherited は「明示設定を消したら適用される値」を返す', () => {
    const metas = resolveSectionMetas({
      key: 'C',
      sections: [section('Aメロ'), section('サビ', { key: 'Am' }), section('Cメロ', { key: 'F' })],
    })

    expect(metas[0].inherited.key).toBe('C')
    expect(metas[1].inherited.key).toBe('C')
    // 直前のサビが Am を確定させているので、Cメロの明示値を消すと Am になる
    expect(metas[2].inherited.key).toBe('Am')
    expect(metas[2].explicit.key).toBe('F')
  })

  it('changed は直前セクションの有効値から変化した項目だけを返す', () => {
    const metas = resolveSectionMetas({
      key: 'C',
      sections: [
        section('Intro'),
        section('サビ', { key: 'Am', bpm: 90 }),
        section('Cメロ'),
        section('大サビ', { key: 'C' }),
      ],
    })

    expect(metas[0].changed).toEqual({ key: undefined, bpm: undefined, timeSignature: undefined })
    expect(metas[1].changed).toEqual({ key: 'Am', bpm: 90, timeSignature: undefined })
    expect(metas[2].changed).toEqual({ key: undefined, bpm: undefined, timeSignature: undefined })
    expect(metas[3].changed).toEqual({ key: 'C', bpm: undefined, timeSignature: undefined })
  })

  it('明示設定が継承値と同じなら changed に載せない', () => {
    const metas = resolveSectionMetas({
      key: 'C',
      sections: [section('Intro', { key: 'C' }), section('Aメロ', { key: 'C' })],
    })

    expect(metas[0].changed.key).toBeUndefined()
    expect(metas[1].changed.key).toBeUndefined()
  })

  it('楽曲キーが未設定なら先頭セクションの明示値は changed になる', () => {
    const metas = resolveSectionMetas({ sections: [section('Intro', { key: 'C' })] })

    expect(metas[0].changed.key).toBe('C')
  })

  it('セクションが空なら空配列を返す', () => {
    expect(resolveSectionMetas({ key: 'C', sections: [] })).toEqual([])
  })
})

describe('resolveSectionMetaById', () => {
  it('ID に対応する解決結果を返す', () => {
    const source = {
      key: 'C',
      sections: [section('Intro'), section('サビ', { key: 'Am' }), section('Cメロ')],
    }

    expect(resolveSectionMetaById(source, 'section-Cメロ')?.effective.key).toBe('Am')
  })

  it('該当セクションが無ければ null', () => {
    expect(resolveSectionMetaById({ key: 'C', sections: [] }, 'unknown')).toBeNull()
  })
})

describe('sectionMetaLabel', () => {
  it('設定済みの項目を中黒で連結する', () => {
    expect(sectionMetaLabel({ key: 'Am', bpm: 90, timeSignature: '6/8' })).toBe(
      'Key Am · BPM 90 · 6/8'
    )
  })

  it('設定済みの項目だけを並べる', () => {
    expect(sectionMetaLabel({ key: 'Am' })).toBe('Key Am')
    expect(sectionMetaLabel({ bpm: 90 })).toBe('BPM 90')
    expect(sectionMetaLabel({ timeSignature: '3/4' })).toBe('3/4')
  })

  it('全て未設定なら空文字', () => {
    expect(sectionMetaLabel({})).toBe('')
  })
})
