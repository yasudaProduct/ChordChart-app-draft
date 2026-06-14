import { describe, it, expect, vi, beforeEach } from 'vitest'

// songServiceをモック
vi.mock('../../src/services/song.service', () => ({
  songService: {
    listMySongs: vi.fn(),
    getMySongSummary: vi.fn(),
  },
}))

// DBモジュールをモック（songServiceがimportしているため）
vi.mock('../../src/db', () => ({
  db: {},
}))

// 認証ミドルウェアをモック
vi.mock('../../src/middleware/auth', () => {
  const { createMiddleware } = require('hono/factory')
  return {
    authMiddleware: () =>
      createMiddleware(async (c: any, next: any) => {
        const authHeader = c.req.header('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return c.json({ error: 'Unauthorized' }, 401)
        }
        // テスト用: Bearer tokenからuserIdを抽出（トークン = userId）
        c.set('userId', authHeader.slice(7))
        c.set('email', 'test@example.com')
        await next()
      }),
    optionalAuthMiddleware: () =>
      createMiddleware(async (c: any, next: any) => {
        const authHeader = c.req.header('Authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          c.set('userId', authHeader.slice(7))
          c.set('email', 'test@example.com')
        }
        await next()
      }),
  }
})

import { app } from '../../src/app'
import { songService } from '../../src/services/song.service'

const mockedSongService = vi.mocked(songService)

// ============================================================
// テスト用モックデータ
// ============================================================

const mockSummary = {
  total: 3,
  private: 1,
  urlOnly: 1,
  specificUsers: 0,
  public: 1,
}

const mockSongListItemDto = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  updatedAt: new Date('2024-01-01'),
}

// ============================================================

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================
// GET /api/me/summary
// ============================================================

describe('GET /api/me/summary', () => {
  it('認証済み: 200 を返し、getMySongSummary が userId で呼ばれる', async () => {
    mockedSongService.getMySongSummary.mockResolvedValueOnce(mockSummary)

    const res = await app.request('/api/me/summary', {
      headers: { Authorization: 'Bearer user_123' },
    })

    expect(res.status).toBe(200)
    expect(mockedSongService.getMySongSummary).toHaveBeenCalledWith('user_123')
    const body = await res.json()
    expect(body.total).toBe(3)
    expect(body.public).toBe(1)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request('/api/me/summary')

    expect(res.status).toBe(401)
    expect(mockedSongService.getMySongSummary).not.toHaveBeenCalled()
  })
})

// ============================================================
// GET /api/me/songs
// ============================================================

describe('GET /api/me/songs', () => {
  it('認証済み: 200 を返し、listMySongs が userId で呼ばれる', async () => {
    mockedSongService.listMySongs.mockResolvedValueOnce([mockSongListItemDto])

    const res = await app.request('/api/me/songs', {
      headers: { Authorization: 'Bearer user_123' },
    })

    expect(res.status).toBe(200)
    expect(mockedSongService.listMySongs).toHaveBeenCalledWith('user_123', undefined)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Test Song')
  })

  it('認証済み + limit 指定: listMySongs に limit が渡される', async () => {
    mockedSongService.listMySongs.mockResolvedValueOnce([mockSongListItemDto])

    const res = await app.request('/api/me/songs?limit=5', {
      headers: { Authorization: 'Bearer user_123' },
    })

    expect(res.status).toBe(200)
    expect(mockedSongService.listMySongs).toHaveBeenCalledWith('user_123', 5)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request('/api/me/songs')

    expect(res.status).toBe(401)
    expect(mockedSongService.listMySongs).not.toHaveBeenCalled()
  })
})
