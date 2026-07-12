import { Hono } from 'hono'
import { shareService } from '../services/share.service'

// ============================================================
// 共有リンク解決ルート（認証不要）
// ============================================================

export const shareRoutes = new Hono()

// GET /:token — 共有トークンから曲を取得
// トークンが無効・期限切れ、または曲がリンク共有を許可していない場合は 404
shareRoutes.get('/:token', async (c) => {
  const token = c.req.param('token')
  const song = await shareService.resolveShareToken(token)

  if (!song) {
    return c.json({ error: 'Share not found' }, 404)
  }

  return c.json(song)
})
