import { Hono } from 'hono'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const webhookRoutes = new Hono()

/**
 * Clerk Webhook: ユーザーの作成・更新・削除を同期する。
 * Clerk Dashboard で Webhook エンドポイントとして登録し、
 * user.created / user.updated / user.deleted イベントを送信する。
 *
 * 本番環境では svix による署名検証を追加すること。
 */
webhookRoutes.post('/clerk', async (c) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (webhookSecret) {
    const svixId = c.req.header('svix-id')
    const svixTimestamp = c.req.header('svix-timestamp')
    const svixSignature = c.req.header('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return c.json({ error: 'Missing svix headers' }, 400)
    }
  }

  const payload = await c.req.json()
  const eventType = payload.type as string
  const data = payload.data

  switch (eventType) {
    case 'user.created':
    case 'user.updated': {
      const email =
        data.email_addresses?.find(
          (e: { id: string }) => e.id === data.primary_email_address_id
        )?.email_address ?? ''

      const displayName =
        [data.first_name, data.last_name].filter(Boolean).join(' ') || null

      await db
        .insert(users)
        .values({
          id: data.id,
          email,
          displayName,
          avatarUrl: data.image_url ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email,
            displayName,
            avatarUrl: data.image_url ?? null,
            updatedAt: new Date(),
          },
        })
      break
    }
    case 'user.deleted': {
      if (data.id) {
        await db.delete(users).where(eq(users.id, data.id))
      }
      break
    }
  }

  return c.json({ received: true })
})
