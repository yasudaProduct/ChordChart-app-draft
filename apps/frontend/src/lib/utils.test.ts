import { describe, expect, it } from 'vitest'
import { withCurrentOption } from './utils'

describe('withCurrentOption', () => {
  it('現在値が一覧にあればそのまま返す', () => {
    expect(withCurrentOption(['4/4', '3/4'], '3/4')).toEqual(['4/4', '3/4'])
  })

  it('現在値が一覧に無ければ先頭に差し込む', () => {
    expect(withCurrentOption(['4/4', '3/4'], '5/4')).toEqual(['5/4', '4/4', '3/4'])
  })

  it('現在値が空文字なら差し込まない', () => {
    expect(withCurrentOption(['4/4', '3/4'], '')).toEqual(['4/4', '3/4'])
  })

  it('元の配列を変更しない（as const の一覧をそのまま渡せる）', () => {
    const options = ['4/4', '3/4'] as const
    withCurrentOption(options, '5/4')
    expect(options).toEqual(['4/4', '3/4'])
  })
})
