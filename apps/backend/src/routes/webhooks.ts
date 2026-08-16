import { Hono } from 'hono'
import { Webhook, WebhookVerificationError } from 'svix'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const webhookRoutes = new Hono()

/**
 * Clerk Webhook: ユーザーの作成・更新・削除を同期する。
 * Clerk Dashboard で Webhook エンドポイントとして登録し、
 * user.created / user.updated / user.deleted イベントを送信する。
 */
webhookRoutes.post('/clerk', async (c) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    return c.json({ error: 'Webhook secret not configured' }, 500)
  }

  const svixId = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing svix headers' }, 400)
  }

  const body = await c.req.text()

  let payload: { type: string; data: Record<string, any> }
  try {
    const wh = new Webhook(webhookSecret)
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: Record<string, any> }
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return c.json({ error: 'Invalid signature' }, 400)
    }
    throw err
  }

  const eventType = payload.type
  const data = payload.data

  switch (eventType) {
    case 'user.created':
    case 'user.updated': {
      const email =
        data.email_addresses?.find((e: { id: string }) => e.id === data.primary_email_address_id)
          ?.email_address ?? ''

      const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null

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
