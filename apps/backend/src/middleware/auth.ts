import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { db } from '../db'
import { users } from '../db/schema'

export type AuthVariables = {
  userId: string | undefined
  email: string | undefined
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

const getJWKS = () => {
  if (!jwks) {
    const clerkIssuer = process.env.CLERK_ISSUER
    if (!clerkIssuer) {
      throw new Error('CLERK_ISSUER environment variable is not set')
    }
    jwks = createRemoteJWKSet(new URL(`${clerkIssuer}/.well-known/jwks.json`))
  }
  return jwks
}

const verifyToken = async (token: string) => {
  const clerkIssuer = process.env.CLERK_ISSUER
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: clerkIssuer,
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
 * Just-in-Timeプロビジョニング。
 * Clerk Webhook (user.created) がローカル未達・レースコンディション・配信失敗等で
 * まだ Users に反映されていない場合でも、JWT検証済みユーザーによる書き込み系操作が
 * 外部キー制約違反 (FK violation) で失敗しないよう、ここで存在を保証する。
 * 既にレコードがある場合は Webhook 側の情報を優先し、上書きしない。
 */
const ensureUserExists = async (userId: string, email: string | undefined) => {
  await db
    .insert(users)
    .values({ id: userId, email: email ?? '' })
    .onConflictDoNothing({ target: users.id })
}

/**
 * 認証必須のミドルウェア
 * Authorization: Bearer {token} からJWTを検証し、userId/email をコンテキストに格納する。
 * トークンが無い・不正な場合は 401 Unauthorized を返す。
 * 検証成功時は Users テーブルへの存在保証（JITプロビジョニング）も行う。
 */
export const authMiddleware = () => {
  return createMiddleware(async (c, next) => {
    const token = extractToken(c.req.header('Authorization'))

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    let userId: string | undefined
    let email: string | undefined
    try {
      const payload = await verifyToken(token)
      userId = payload.sub
      email = payload.email as string | undefined
    } catch {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await ensureUserExists(userId, email)

    c.set('userId', userId)
    c.set('email', email)

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
