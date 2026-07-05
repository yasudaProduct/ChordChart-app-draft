import { describe, it, expect, vi, beforeEach } from 'vitest'

// songServiceをモック
vi.mock('../../src/services/song.service', () => ({
  songService: {
    listSongs: vi.fn(),
    searchSongs: vi.fn(),
    getSongById: vi.fn(),
    createSong: vi.fn(),
    updateSong: vi.fn(),
    updateSongVisibility: vi.fn(),
    deleteSong: vi.fn(),
  },
}))

// shareServiceをモック（songs ルートが共有エンドポイントで使用）
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
import { shareService } from '../../src/services/share.service'
import { songService } from '../../src/services/song.service'

const mockedSongService = vi.mocked(songService)
const mockedShareService = vi.mocked(shareService)

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

const mockShareDto = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  songId: mockSongDto.id,
  token: '323e4567-e89b-12d3-a456-426614174000',
  expiresAt: null,
  createdAt: new Date('2024-01-01'),
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

    const res = await app.request(`/api/songs/${mockSongDto.id}`)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Test Song')
  })

  it('存在しない曲: 404 を返す', async () => {
    mockedSongService.getSongById.mockResolvedValueOnce(null)

    const res = await app.request('/api/songs/00000000-0000-0000-0000-000000000000')

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
// PATCH /api/songs/:id（公開範囲の変更）
// ============================================================

describe('PATCH /api/songs/:id', () => {
  it('認証済み + 所有者: 200 を返し visibility が更新される', async () => {
    mockedSongService.updateSongVisibility.mockResolvedValueOnce({
      ...mockSongDto,
      visibility: 'public',
    })

    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visibility: 'public' }),
    })

    expect(res.status).toBe(200)
    expect(mockedSongService.updateSongVisibility).toHaveBeenCalledWith(
      mockSongDto.id,
      'test-user-id',
      'public'
    )
    const body = await res.json()
    expect(body.visibility).toBe('public')
  })

  it('認証済み + 非所有者: 404 を返す', async () => {
    mockedSongService.updateSongVisibility.mockResolvedValueOnce(null)

    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer other-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visibility: 'public' }),
    })

    expect(res.status).toBe(404)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: 'public' }),
    })

    expect(res.status).toBe(401)
    expect(mockedSongService.updateSongVisibility).not.toHaveBeenCalled()
  })

  it('不正な visibility: 400 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visibility: 'invalid' }),
    })

    expect(res.status).toBe(400)
    expect(mockedSongService.updateSongVisibility).not.toHaveBeenCalled()
  })

  it('specific_users は未対応のため 400 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visibility: 'specific_users' }),
    })

    expect(res.status).toBe(400)
    expect(mockedSongService.updateSongVisibility).not.toHaveBeenCalled()
  })
})

// ============================================================
// POST /api/songs（visibility 指定）
// ============================================================

describe('POST /api/songs with visibility', () => {
  it('visibility を指定して作成できる', async () => {
    mockedSongService.createSong.mockResolvedValueOnce({
      ...mockSongDto,
      visibility: 'url_only',
    })

    const res = await app.request('/api/songs', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Test Song', visibility: 'url_only' }),
    })

    expect(res.status).toBe(201)
    expect(mockedSongService.createSong).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({ visibility: 'url_only' })
    )
  })

  it('不正な visibility: 400 を返す', async () => {
    const res = await app.request('/api/songs', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Test Song', visibility: 'bogus' }),
    })

    expect(res.status).toBe(400)
    expect(mockedSongService.createSong).not.toHaveBeenCalled()
  })
})

// ============================================================
// GET /api/songs/:id/share
// ============================================================

describe('GET /api/songs/:id/share', () => {
  it('有効な共有リンクがある: 200 を返す', async () => {
    mockedShareService.getShareForSong.mockResolvedValueOnce(mockShareDto)

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      headers: { Authorization: 'Bearer test-user-id' },
    })

    expect(res.status).toBe(200)
    expect(mockedShareService.getShareForSong).toHaveBeenCalledWith(mockSongDto.id, 'test-user-id')
    const body = await res.json()
    expect(body.token).toBe(mockShareDto.token)
  })

  it('曲が存在しない/非所有者: 404 を返す', async () => {
    mockedShareService.getShareForSong.mockResolvedValueOnce(undefined)

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      headers: { Authorization: 'Bearer other-user-id' },
    })

    expect(res.status).toBe(404)
  })

  it('共有リンクが無い: 404 を返す', async () => {
    mockedShareService.getShareForSong.mockResolvedValueOnce(null)

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      headers: { Authorization: 'Bearer test-user-id' },
    })

    expect(res.status).toBe(404)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}/share`)

    expect(res.status).toBe(401)
    expect(mockedShareService.getShareForSong).not.toHaveBeenCalled()
  })
})

// ============================================================
// POST /api/songs/:id/share
// ============================================================

describe('POST /api/songs/:id/share', () => {
  it('新規発行: 201 を返す', async () => {
    mockedShareService.createShare.mockResolvedValueOnce({
      share: mockShareDto,
      created: true,
    })

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(201)
    expect(mockedShareService.createShare).toHaveBeenCalledWith(mockSongDto.id, 'test-user-id', {
      expiresInDays: null,
    })
  })

  it('有効期限付きで発行できる', async () => {
    mockedShareService.createShare.mockResolvedValueOnce({
      share: { ...mockShareDto, expiresAt: new Date('2024-02-01') },
      created: true,
    })

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresInDays: 7 }),
    })

    expect(res.status).toBe(201)
    expect(mockedShareService.createShare).toHaveBeenCalledWith(mockSongDto.id, 'test-user-id', {
      expiresInDays: 7,
    })
  })

  it('既に有効なリンクがある: 200 を返す', async () => {
    mockedShareService.createShare.mockResolvedValueOnce({
      share: mockShareDto,
      created: false,
    })

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(200)
  })

  it('曲が存在しない/非所有者: 404 を返す', async () => {
    mockedShareService.createShare.mockResolvedValueOnce(null)

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer other-user-id',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(404)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(401)
    expect(mockedShareService.createShare).not.toHaveBeenCalled()
  })
})

// ============================================================
// DELETE /api/songs/:id/share
// ============================================================

describe('DELETE /api/songs/:id/share', () => {
  it('失効成功: 204 を返す', async () => {
    mockedShareService.deleteShare.mockResolvedValueOnce(true)

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-user-id' },
    })

    expect(res.status).toBe(204)
    expect(mockedShareService.deleteShare).toHaveBeenCalledWith(mockSongDto.id, 'test-user-id')
  })

  it('共有リンクが無い/非所有者: 404 を返す', async () => {
    mockedShareService.deleteShare.mockResolvedValueOnce(false)

    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-user-id' },
    })

    expect(res.status).toBe(404)
  })

  it('認証なし: 401 を返す', async () => {
    const res = await app.request(`/api/songs/${mockSongDto.id}/share`, {
      method: 'DELETE',
    })

    expect(res.status).toBe(401)
    expect(mockedShareService.deleteShare).not.toHaveBeenCalled()
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
    expect(mockedSongService.deleteSong).toHaveBeenCalledWith(mockSongDto.id, 'test-user-id')
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
