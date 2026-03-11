import { describe, it, expect, vi, beforeEach } from 'vitest'

// songServiceをモック
vi.mock('../../src/services/song.service', () => ({
  songService: {
    listSongs: vi.fn(),
    searchSongs: vi.fn(),
    getSongById: vi.fn(),
    createSong: vi.fn(),
    updateSong: vi.fn(),
    deleteSong: vi.fn(),
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

const mockSongDto = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  bpm: 120,
  timeSignature: '4/4',
  content: { sections: [] },
  visibility: 'private',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
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
// GET /api/songs
// ============================================================

describe('GET /api/songs', () => {
  it('曲一覧: songService.listSongs() が呼ばれる → 200', async () => {
    mockedSongService.listSongs.mockResolvedValueOnce([mockSongListItemDto])

    const res = await app.request('/api/songs')

    expect(res.status).toBe(200)
    expect(mockedSongService.listSongs).toHaveBeenCalledWith()
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].title).toBe('Test Song')
  })
})

// ============================================================
// GET /api/songs/search?q=test
// ============================================================

describe('GET /api/songs/search', () => {
  it('200 を返し、songService.searchSongs が呼ばれる', async () => {
    mockedSongService.searchSongs.mockResolvedValueOnce([mockSongListItemDto])

    const res = await app.request('/api/songs/search?q=test')

    expect(res.status).toBe(200)
    expect(mockedSongService.searchSongs).toHaveBeenCalledWith('test')
    const body = await res.json()
    expect(body).toHaveLength(1)
  })
})

// ============================================================
// GET /api/songs/:id
// ============================================================

describe('GET /api/songs/:id', () => {
  it('存在する曲: 200 を返す', async () => {
    mockedSongService.getSongById.mockResolvedValueOnce(mockSongDto)

    const res = await app.request(
      `/api/songs/${mockSongDto.id}`
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Test Song')
  })

  it('存在しない曲: 404 を返す', async () => {
    mockedSongService.getSongById.mockResolvedValueOnce(null)

    const res = await app.request(
      '/api/songs/00000000-0000-0000-0000-000000000000'
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Song not found')
  })
})

// ============================================================
// POST /api/songs
// ============================================================

describe('POST /api/songs', () => {
  it('認証済み + 正しいボディ: 201 を返す', async () => {
    mockedSongService.createSong.mockResolvedValueOnce(mockSongDto)

    const res = await app.request('/api/songs', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Song',
        artist: 'Test Artist',
        key: 'C',
        bpm: 120,
      }),
    })

    expect(res.status).toBe(201)
    expect(mockedSongService.createSong).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ title: 'Test Song' })
    )
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Song' }),
    })

    expect(res.status).toBe(401)
    expect(mockedSongService.createSong).not.toHaveBeenCalled()
  })

  it('バリデーションエラー（titleなし）: 400 を返す', async () => {
    const res = await app.request('/api/songs', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ artist: 'Test Artist' }),
    })

    expect(res.status).toBe(400)
    expect(mockedSongService.createSong).not.toHaveBeenCalled()
  })
})

// ============================================================
// PUT /api/songs/:id
// ============================================================

describe('PUT /api/songs/:id', () => {
  it('認証済み + 所有者: 200 を返す', async () => {
    mockedSongService.updateSong.mockResolvedValueOnce(mockSongDto)

    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Song',
        artist: 'Test Artist',
      }),
    })

    expect(res.status).toBe(200)
    expect(mockedSongService.updateSong).toHaveBeenCalledWith(
      mockSongDto.id,
      'test-user-id',
      expect.objectContaining({ title: 'Updated Song' })
    )
  })

  it('認証済み + 非所有者: 404 を返す', async () => {
    mockedSongService.updateSong.mockResolvedValueOnce(null)

    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer other-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Song',
      }),
    })

    expect(res.status).toBe(404)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Song' }),
    })

    expect(res.status).toBe(401)
    expect(mockedSongService.updateSong).not.toHaveBeenCalled()
  })
})

// ============================================================
// DELETE /api/songs/:id
// ============================================================

describe('DELETE /api/songs/:id', () => {
  it('認証済み + 所有者: 204 を返す', async () => {
    mockedSongService.deleteSong.mockResolvedValueOnce(true)

    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-user-id' },
    })

    expect(res.status).toBe(204)
    expect(mockedSongService.deleteSong).toHaveBeenCalledWith(
      mockSongDto.id,
      'test-user-id'
    )
  })

  it('認証済み + 非所有者: 404 を返す', async () => {
    mockedSongService.deleteSong.mockResolvedValueOnce(false)

    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer other-user-id' },
    })

    expect(res.status).toBe(404)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'DELETE',
    })

    expect(res.status).toBe(401)
    expect(mockedSongService.deleteSong).not.toHaveBeenCalled()
  })
})
