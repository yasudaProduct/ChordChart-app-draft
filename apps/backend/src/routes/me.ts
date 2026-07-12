import { Hono } from 'hono'
import type { AuthVariables } from '../middleware/auth'
import { authMiddleware } from '../middleware/auth'
import { songService } from '../services/song.service'

// ============================================================
// マイページ用ルート（すべて認証必須）
// ============================================================

export const meRoutes = new Hono<{ Variables: AuthVariables }>()

// GET /summary — 自分の曲数を可視性別に集計
meRoutes.get('/summary', authMiddleware(), async (c) => {
  const userId = c.get('userId')!
  const summary = await songService.getMySongSummary(userId)
  return c.json(summary)
})

// GET /songs — 自分の曲一覧（limit 指定で最近 N 件）
meRoutes.get('/songs', authMiddleware(), async (c) => {
  const userId = c.get('userId')!
  const limitParam = c.req.query('limit')
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined
  const limit =
    parsedLimit !== undefined && Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : undefined

  const songs = await songService.listMySongs(userId, limit)
  return c.json(songs)
})
