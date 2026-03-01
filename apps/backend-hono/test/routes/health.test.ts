import { describe, it, expect } from 'vitest'
import { app } from '../../src/app'

describe('GET /api/health', () => {
  it('should return healthy status', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('healthy')
    expect(body.timestamp).toBeDefined()
  })
})
