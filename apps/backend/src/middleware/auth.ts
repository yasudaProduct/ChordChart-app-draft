import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export type AuthVariables = {
  userId: string | undefined
  email: string | undefined
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

const getJWKS = () => {
  if (!jwks) {
    const supabaseUrl = process.env.SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is not set')
    }
    jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
    )
  }
  return jwks
}

const verifyToken = async (token: string) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: `${supabaseUrl}/auth/v1`,
    audience: 'authenticated',
  })
  return payload
}

const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

/**
 * 認証必須のミドルウェア
 * Authorization: Bearer {token} からJWTを検証し、userId/email をコンテキストに格納する。
 * トークンが無い・不正な場合は 401 Unauthorized を返す。
 */
export const authMiddleware = () => {
  return createMiddleware(async (c, next) => {
    const token = extractToken(c.req.header('Authorization'))

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const payload = await verifyToken(token)
      c.set('userId', payload.sub)
      c.set('email', payload.email as string | undefined)
    } catch {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await next()
  })
}

/**
 * 認証オプションのミドルウェア（AllowAnonymous相当）
 * トークンがあれば検証してuserId/emailをセットする。
 * トークンがない場合や不正な場合もリクエストを通過させる（userId/email は undefined）。
 */
export const optionalAuthMiddleware = () => {
  return createMiddleware(async (c, next) => {
    const token = extractToken(c.req.header('Authorization'))

    if (token) {
      try {
        const payload = await verifyToken(token)
        c.set('userId', payload.sub)
        c.set('email', payload.email as string | undefined)
      } catch {
        // トークンが不正な場合もスルー（undefinedとして通過）
      }
    }

    await next()
  })
}
