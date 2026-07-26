import { describe, expect, it } from 'vitest'
import { songMetaEntries, songMetaLine } from './songMeta'

describe('songMetaEntries', () => {
  it('すべて設定済みなら Key・BPM・拍子の順に返す', () => {
    expect(songMetaEntries({ key: 'C', bpm: 120, timeSignature: '4/4' })).toEqual([
      { id: 'key', label: 'Key', value: 'C' },
      { id: 'bpm', label: 'BPM', value: '120' },
      { id: 'timeSignature', value: '4/4' },
    ])
  })

  it('未設定（undefined）の項目は含めない', () => {
    expect(songMetaEntries({ key: 'Am', bpm: undefined, timeSignature: undefined })).toEqual([
      { id: 'key', label: 'Key', value: 'Am' },
    ])
  })

  it('すべて未設定なら空配列を返す', () => {
    expect(songMetaEntries({ key: undefined, bpm: undefined, timeSignature: undefined })).toEqual(
      []
    )
  })

  it('空文字のキー・拍子は未設定として扱う', () => {
    expect(songMetaEntries({ key: '', bpm: 90, timeSignature: '' })).toEqual([
      { id: 'bpm', label: 'BPM', value: '90' },
    ])
  })

  it('拍子だけ設定済みの場合はラベルなしで返す', () => {
    expect(songMetaEntries({ key: undefined, bpm: undefined, timeSignature: '3/4' })).toEqual([
      { id: 'timeSignature', value: '3/4' },
    ])
  })
})

describe('songMetaLine', () => {
  it('すべて設定済みなら中黒区切りで連結する', () => {
    expect(songMetaLine({ artist: 'ChordBook', key: 'C', bpm: 120, timeSignature: '4/4' })).toBe(
      'ChordBook · Key C · BPM 120 · 4/4'
    )
  })

  it('未設定の項目は省略する', () => {
    expect(
      songMetaLine({ artist: 'ChordBook', key: 'C', bpm: undefined, timeSignature: undefined })
    ).toBe('ChordBook · Key C')
  })

  it('キー・BPM・拍子がすべて未設定ならアーティストのみになる', () => {
    expect(
      songMetaLine({
        artist: 'ChordBook',
        key: undefined,
        bpm: undefined,
        timeSignature: undefined,
      })
    ).toBe('ChordBook')
  })

  it('アーティスト未設定時はプレースホルダを表示する', () => {
    expect(
      songMetaLine({ artist: undefined, key: undefined, bpm: undefined, timeSignature: undefined })
    ).toBe('アーティスト未設定')
  })
})
