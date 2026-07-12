import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { songs, songShares } from '../db/schema'
import { Visibility } from '../types'
import { toSongDto, type SongDto } from './song.service'

// ============================================================
// DTO 型定義
// ============================================================

export type ShareDto = {
  id: string
  songId: string
  token: string
  expiresAt: Date | null
  createdAt: Date
}

// ============================================================
// ヘルパー
// ============================================================

const toShareDto = (share: typeof songShares.$inferSelect): ShareDto => ({
  id: share.id,
  songId: share.songId,
  token: share.shareToken,
  expiresAt: share.expiresAt,
  createdAt: share.createdAt,
})

const isExpired = (share: typeof songShares.$inferSelect, now: Date): boolean =>
  share.expiresAt !== null && share.expiresAt.getTime() <= now.getTime()

/** 所有者チェック付きで曲を取得する。 */
const findOwnedSong = async (songId: string, userId: string) => {
  const results = await db
    .select()
    .from(songs)
    .where(and(eq(songs.id, songId), eq(songs.userId, userId)))
    .limit(1)
  return results[0] ?? null
}

// ============================================================
// サービス関数
// ============================================================

/**
 * 曲の有効な共有リンクを取得する。所有者のみ。
 * 曲が存在しない・所有者でない場合は undefined、共有リンクが無い場合は null。
 */
const getShareForSong = async (
  songId: string,
  userId: string
): Promise<ShareDto | null | undefined> => {
  const song = await findOwnedSong(songId, userId)
  if (!song) return undefined

  const results = await db
    .select()
    .from(songShares)
    .where(eq(songShares.songId, songId))
    .orderBy(desc(songShares.createdAt))

  const now = new Date()
  const active = results.find((share) => !isExpired(share, now))
  return active ? toShareDto(active) : null
}

/**
 * 曲の共有リンクを発行する。所有者のみ。
 * 有効なリンクが既にあればそれを返す（created: false）。
 * 期限切れのリンクは削除して新規発行する。
 */
const createShare = async (
  songId: string,
  userId: string,
  options?: { expiresInDays?: number | null }
): Promise<{ share: ShareDto; created: boolean } | null> => {
  const song = await findOwnedSong(songId, userId)
  if (!song) return null

  const existing = await db
    .select()
    .from(songShares)
    .where(eq(songShares.songId, songId))
    .orderBy(desc(songShares.createdAt))

  const now = new Date()
  const active = existing.find((share) => !isExpired(share, now))
  if (active) {
    return { share: toShareDto(active), created: false }
  }

  // 期限切れリンクを掃除してから発行する
  if (existing.length > 0) {
    await db.delete(songShares).where(eq(songShares.songId, songId))
  }

  const expiresInDays = options?.expiresInDays ?? null
  const expiresAt =
    expiresInDays !== null ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000) : null

  const results = await db
    .insert(songShares)
    .values({
      songId,
      shareToken: crypto.randomUUID(),
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return { share: toShareDto(results[0]), created: true }
}

/**
 * 曲の共有リンクを失効（削除）する。所有者のみ。
 */
const deleteShare = async (songId: string, userId: string): Promise<boolean> => {
  const song = await findOwnedSong(songId, userId)
  if (!song) return false

  const results = await db
    .delete(songShares)
    .where(eq(songShares.songId, songId))
    .returning({ id: songShares.id })

  return results.length > 0
}

/**
 * 共有トークンから曲を解決する（認証不要）。
 * トークンが無効・期限切れ、または曲の公開範囲がリンク共有を許可しない場合は null。
 */
const resolveShareToken = async (token: string): Promise<SongDto | null> => {
  const results = await db
    .select({ share: songShares, song: songs })
    .from(songShares)
    .innerJoin(songs, eq(songShares.songId, songs.id))
    .where(eq(songShares.shareToken, token))
    .limit(1)

  if (results.length === 0) return null

  const { share, song } = results[0]
  if (isExpired(share, new Date())) return null

  // 非公開・特定ユーザー限定に切り替えられた曲はリンクでも見せない
  if (song.visibility !== Visibility.UrlOnly && song.visibility !== Visibility.Public) {
    return null
  }

  return toSongDto(song)
}

export const shareService = {
  getShareForSong,
  createShare,
  deleteShare,
  resolveShareToken,
}
