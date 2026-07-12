import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { AuthVariables } from './middleware/auth'
import { healthRoutes } from './routes/health'
import { meRoutes } from './routes/me'
import { shareRoutes } from './routes/shares'
import { songRoutes } from './routes/songs'
import { webhookRoutes } from './routes/webhooks'

/** Cloudflare Workers の [vars] / シークレット（Hono の c.env） */
export type WorkerBindings = {
  ALLOWED_ORIGINS?: string
}

type AppEnv = {
  Bindings: WorkerBindings
  Variables: AuthVariables
}

const app = new Hono<AppEnv>()

// ミドルウェア
app.use('*', logger())

// CORS設定
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const raw =
        c.env?.ALLOWED_ORIGINS?.trim() ||
        process.env.ALLOWED_ORIGINS?.trim() ||
        'http://localhost:3000'
      const allowedOrigins = raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// ルート
app.route('/api/health', healthRoutes)
app.route('/api/songs', songRoutes)
app.route('/api/shares', shareRoutes)
app.route('/api/me', meRoutes)
app.route('/api/webhooks', webhookRoutes)

// グローバルエラーハンドラ
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// 404ハンドラ
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export { app }
export type { AppEnv }
