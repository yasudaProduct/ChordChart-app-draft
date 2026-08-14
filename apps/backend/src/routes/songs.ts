import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AuthVariables } from '../middleware/auth'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth'
import { shareService } from '../services/share.service'
import { songService } from '../services/song.service'

// ============================================================
// Zod バリデーションスキーマ
// ============================================================

// specific_users は共有先管理（ロードマップ G4）実装まで受け付けない
const visibilitySchema = z.enum(['private', 'url_only', 'public'])

const createSongSchema = z.object({
  title: z.string().min(1),
  artist: z.string().nullable().optional(),
  key: z.string().nullable().optional(),
  bpm: z.number().int().nullable().optional(),
  timeSignature: z.string().nullable().optional(),
  visibility: visibilitySchema.optional(),
})

const updateSongSchema = z.object({
  title: z.string().min(1),
  artist: z.string().nullable().optional(),
  key: z.string().nullable().optional(),
  bpm: z.number().int().nullable().optional(),
  timeSignature: z.string().nullable().optional(),
  content: z.string().optional(),
  visibility: visibilitySchema.optional(),
})

const patchSongSchema = z.object({
  visibility: visibilitySchema,
})

const createShareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
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

// GET /demo — デモ用曲一覧（/:id より前に定義）
songRoutes.get('/demo', async (c) => {
  const results = await songService.listDemoSongs()
  return c.json(results)
})

// GET /artists — 公開曲のアーティスト名一覧（入力サジェスト用・/:id より前に定義）
songRoutes.get('/artists', async (c) => {
  const artists = await songService.listPublicArtists()
  return c.json(artists)
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

// PATCH /:id — 曲の部分更新（公開範囲の変更）
songRoutes.patch(
  '/:id',
  authMiddleware(),
  zValidator('json', patchSongSchema, validationHook),
  async (c) => {
    const id = c.req.param('id')
    const userId = c.get('userId')!
    const body = c.req.valid('json')
    const song = await songService.updateSongVisibility(id, userId, body.visibility)

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

// ============================================================
// 共有リンク（所有者のみ）
// ============================================================

// GET /:id/share — 曲の有効な共有リンクを取得
songRoutes.get('/:id/share', authMiddleware(), async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')!
  const share = await shareService.getShareForSong(id, userId)

  if (share === undefined) {
    return c.json({ error: 'Song not found' }, 404)
  }
  if (share === null) {
    return c.json({ error: 'Share not found' }, 404)
  }

  return c.json(share)
})

// POST /:id/share — 共有リンクを発行（既に有効なリンクがあればそれを返す）
songRoutes.post(
  '/:id/share',
  authMiddleware(),
  zValidator('json', createShareSchema, validationHook),
  async (c) => {
    const id = c.req.param('id')
    const userId = c.get('userId')!
    const body = c.req.valid('json')
    const result = await shareService.createShare(id, userId, {
      expiresInDays: body.expiresInDays ?? null,
    })

    if (!result) {
      return c.json({ error: 'Song not found' }, 404)
    }

    return c.json(result.share, result.created ? 201 : 200)
  }
)

// DELETE /:id/share — 共有リンクを失効
songRoutes.delete('/:id/share', authMiddleware(), async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')!
  const deleted = await shareService.deleteShare(id, userId)

  if (!deleted) {
    return c.json({ error: 'Share not found' }, 404)
  }

  return c.body(null, 204)
})
