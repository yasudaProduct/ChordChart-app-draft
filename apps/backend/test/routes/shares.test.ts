import { describe, it, expect, vi, beforeEach } from 'vitest'

// shareServiceをモック
vi.mock('../../src/services/share.service', () => ({
  shareService: {
    getShareForSong: vi.fn(),
    createShare: vi.fn(),
    deleteShare: vi.fn(),
    resolveShareToken: vi.fn(),
  },
}))

// DBモジュールをモック（songServiceがimportしているため）
vi.mock('../../src/db', () => ({
  db: {},
}))

import { app } from '../../src/app'
import { shareService } from '../../src/services/share.service'

const mockedShareService = vi.mocked(shareService)

const mockSongDto = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Shared Song',
  artist: 'Test Artist',
  key: 'C',
  bpm: 120,
  timeSignature: '4/4',
  content: { sections: [] },
  visibility: 'url_only',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================
// GET /api/shares/:token
// ============================================================

describe('GET /api/shares/:token', () => {
  it('有効なトークン: 200 で曲を返す（認証不要）', async () => {
    mockedShareService.resolveShareToken.mockResolvedValueOnce(mockSongDto)

    const res = await app.request('/api/shares/valid-token')

    expect(res.status).toBe(200)
    expect(mockedShareService.resolveShareToken).toHaveBeenCalledWith('valid-token')
    const body = await res.json()
    expect(body.title).toBe('Shared Song')
  })

  it('無効・期限切れ・非公開に変更済みのトークン: 404 を返す', async () => {
    mockedShareService.resolveShareToken.mockResolvedValueOnce(null)

    const res = await app.request('/api/shares/invalid-token')

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Share not found')
  })
})
