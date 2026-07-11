import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// jose をモック（実際の JWKS 取得・署名検証はテスト対象外）
const mockJwtVerify = vi.fn()
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}))

// db.insert(...).values(...).onConflictDoNothing(...) をモック
const mockOnConflictDoNothing = vi.fn().mockResolvedValue(undefined)
const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }))
const mockInsert = vi.fn(() => ({ values: mockValues }))
vi.mock('../../src/db', () => ({
  db: { insert: (...args: unknown[]) => mockInsert(...args) },
}))

import { authMiddleware, optionalAuthMiddleware } from '../../src/middleware/auth'

const buildApp = (mw: ReturnType<typeof authMiddleware>) => {
  const app = new Hono()
  app.get('/protected', mw, (c) => c.json({ userId: c.get('userId'), email: c.get('email') }))
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authMiddleware', () => {
  it('有効なトークン: userId/emailをセットし、Usersへ存在保証のupsertを行う (JITプロビジョニング)', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'user_123', email: 'user@example.com' },
    })

    const app = buildApp(authMiddleware())
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ userId: 'user_123', email: 'user@example.com' })

    expect(mockInsert).toHaveBeenCalledOnce()
    expect(mockValues).toHaveBeenCalledWith({ id: 'user_123', email: 'user@example.com' })
    expect(mockOnConflictDoNothing).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.anything() })
    )
  })

  it('JWTにemailクレームが無い: 空文字でUsersへupsertする', async () => {
    mockJwtVerify.mockResolvedValueOnce({ payload: { sub: 'user_456' } })

    const app = buildApp(authMiddleware())
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    expect(mockValues).toHaveBeenCalledWith({ id: 'user_456', email: '' })
  })

  it('トークンが無い: 401を返し、upsertは行わない', async () => {
    const app = buildApp(authMiddleware())
    const res = await app.request('/protected')

    expect(res.status).toBe(401)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('検証失敗: 401を返し、upsertは行わない', async () => {
    mockJwtVerify.mockRejectedValueOnce(new Error('invalid signature'))

    const app = buildApp(authMiddleware())
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer bad-token' },
    })

    expect(res.status).toBe(401)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

describe('optionalAuthMiddleware', () => {
  it('トークンが無い: userIdはundefinedのまま通過し、upsertは行わない', async () => {
    const app = buildApp(optionalAuthMiddleware())
    const res = await app.request('/protected')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBeUndefined()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('有効なトークン: userId/emailをセットするが、upsertは行わない', async () => {
    mockJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'user_789', email: 'opt@example.com' },
    })

    const app = buildApp(optionalAuthMiddleware())
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ userId: 'user_789', email: 'opt@example.com' })
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
