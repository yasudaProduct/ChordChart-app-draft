import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { AuthVariables } from './middleware/auth'
import { healthRoutes } from './routes/health'
import { songRoutes } from './routes/songs'
import { webhookRoutes } from './routes/webhooks'

type AppEnv = {
  Variables: AuthVariables
}

const app = new Hono<AppEnv>()

// ミドルウェア
app.use('*', logger())

// CORS設定
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// ルート
app.route('/api/health', healthRoutes)
app.route('/api/songs', songRoutes)
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
