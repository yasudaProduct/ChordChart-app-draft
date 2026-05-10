import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AuthVariables } from '../middleware/auth'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth'
import { songService } from '../services/song.service'

// ============================================================
// Zod バリデーションスキーマ
// ============================================================

const createSongSchema = z.object({
  title: z.string().min(1),
  artist: z.string().nullable().optional(),
  key: z.string().nullable().optional(),
  bpm: z.number().int().nullable().optional(),
  timeSignature: z.string().optional().default('4/4'),
})

const updateSongSchema = z.object({
  title: z.string().min(1),
  artist: z.string().nullable().optional(),
  key: z.string().nullable().optional(),
  bpm: z.number().int().nullable().optional(),
  timeSignature: z.string().optional().default('4/4'),
  content: z.string().optional(),
})

// ============================================================
// バリデーションエラーハンドリング用フック
// ============================================================

const validationHook = (result: { success: boolean; error?: z.ZodError }, c: any) => {
  if (!result.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: result.error!.issues,
      },
      400
    )
  }
}

// ============================================================
// ルート定義
// ============================================================

export const songRoutes = new Hono<{ Variables: AuthVariables }>()

// GET /search — 公開曲を検索（/:id より前に定義）
songRoutes.get('/search', optionalAuthMiddleware(), async (c) => {
  const query = c.req.query('q') ?? ''
  const results = await songService.searchSongs(query)
  return c.json(results)
})

// GET / — 曲一覧
songRoutes.get('/', async (c) => {
  const results = await songService.listSongs()
  return c.json(results)
})

// GET /:id — 曲詳細
songRoutes.get('/:id', optionalAuthMiddleware(), async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')
  const song = await songService.getSongById(id, userId)

  if (!song) {
    return c.json({ error: 'Song not found' }, 404)
  }

  return c.json(song)
})

// POST / — 曲作成
songRoutes.post(
  '/',
  authMiddleware(),
  zValidator('json', createSongSchema, validationHook),
  async (c) => {
    const userId = c.get('userId')!
    const body = c.req.valid('json')
    const song = await songService.createSong(userId, body)
    return c.json(song, 201)
  }
)

// PUT /:id — 曲更新
songRoutes.put(
  '/:id',
  authMiddleware(),
  zValidator('json', updateSongSchema, validationHook),
  async (c) => {
    const id = c.req.param('id')
    const userId = c.get('userId')!
    const body = c.req.valid('json')
    const song = await songService.updateSong(id, userId, body)

    if (!song) {
      return c.json({ error: 'Song not found' }, 404)
    }

    return c.json(song)
  }
)

// DELETE /:id — 曲削除
songRoutes.delete('/:id', authMiddleware(), async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')!
  const deleted = await songService.deleteSong(id, userId)

  if (!deleted) {
    return c.json({ error: 'Song not found' }, 404)
  }

  return c.body(null, 204)
})
