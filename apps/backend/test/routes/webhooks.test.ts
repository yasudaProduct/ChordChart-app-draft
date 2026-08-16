import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Webhook } from 'svix'

// db.insert(...).values(...).onConflictDoUpdate(...) と db.delete(...).where(...) をモック
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }))
const mockInsert = vi.fn(() => ({ values: mockValues }))
const mockWhere = vi.fn().mockResolvedValue(undefined)
const mockDelete = vi.fn(() => ({ where: mockWhere }))
vi.mock('../../src/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

import { app } from '../../src/app'

const WEBHOOK_SECRET = `whsec_${Buffer.from('test-signing-secret-for-webhooks').toString('base64')}`

// 実際の svix 実装で正しい署名ヘッダーを生成する（本物の検証ロジックを通すため）
const signPayload = (body: string, secret = WEBHOOK_SECRET) => {
  const svixId = 'msg_test_id'
  const timestamp = new Date()
  const wh = new Webhook(secret)
  return {
    'svix-id': svixId,
    'svix-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
    'svix-signature': wh.sign(svixId, timestamp, body),
  }
}

const postClerkWebhook = (body: string, headers: Record<string, string> = {}) =>
  app.request('/api/webhooks/clerk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  })

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CLERK_WEBHOOK_SECRET = WEBHOOK_SECRET
})

afterEach(() => {
  delete process.env.CLERK_WEBHOOK_SECRET
})

describe('POST /api/webhooks/clerk', () => {
  it('正しい署名 + user.created: users を upsert し 200 を返す', async () => {
    const body = JSON.stringify({
      type: 'user.created',
      data: {
        id: 'user_123',
        email_addresses: [{ id: 'email_1', email_address: 'test@example.com' }],
        primary_email_address_id: 'email_1',
        first_name: 'Taro',
        last_name: 'Yamada',
        image_url: 'https://example.com/avatar.png',
      },
    })

    const res = await postClerkWebhook(body, signPayload(body))

    expect(res.status).toBe(200)
    expect(mockInsert).toHaveBeenCalledOnce()
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user_123',
        email: 'test@example.com',
        displayName: 'Taro Yamada',
        avatarUrl: 'https://example.com/avatar.png',
      })
    )
  })

  it('正しい署名 + user.deleted: users を削除し 200 を返す', async () => {
    const body = JSON.stringify({ type: 'user.deleted', data: { id: 'user_123' } })

    const res = await postClerkWebhook(body, signPayload(body))

    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledOnce()
    expect(mockWhere).toHaveBeenCalledOnce()
  })

  it('未対応のイベントタイプ: DB操作なしで 200 を返す', async () => {
    const body = JSON.stringify({ type: 'session.created', data: {} })

    const res = await postClerkWebhook(body, signPayload(body))

    expect(res.status).toBe(200)
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('svixヘッダーが無い: 400 を返し DB操作は行わない', async () => {
    const body = JSON.stringify({ type: 'user.created', data: {} })

    const res = await postClerkWebhook(body)

    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('署名が不正: 400 を返し DB操作は行わない', async () => {
    const body = JSON.stringify({ type: 'user.created', data: { id: 'user_123' } })
    const headers = signPayload(body)

    const res = await postClerkWebhook(body, { ...headers, 'svix-signature': 'v1,dGFtcGVyZWQ=' })

    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('署名後にペイロードが改ざんされている: 400 を返す', async () => {
    const originalBody = JSON.stringify({ type: 'user.created', data: { id: 'user_123' } })
    const headers = signPayload(originalBody)
    const tamperedBody = JSON.stringify({ type: 'user.deleted', data: { id: 'user_123' } })

    const res = await postClerkWebhook(tamperedBody, headers)

    expect(res.status).toBe(400)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('別のシークレットで署名されている: 400 を返す', async () => {
    const body = JSON.stringify({ type: 'user.created', data: { id: 'user_123' } })
    const wrongSecret = `whsec_${Buffer.from('a-completely-different-secret!!').toString('base64')}`

    const res = await postClerkWebhook(body, signPayload(body, wrongSecret))

    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('CLERK_WEBHOOK_SECRET が未設定: 500 を返す', async () => {
    delete process.env.CLERK_WEBHOOK_SECRET
    const body = JSON.stringify({ type: 'user.created', data: { id: 'user_123' } })

    const res = await postClerkWebhook(body, signPayload(body))

    expect(res.status).toBe(500)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
