import { eq, and, or, ilike, desc } from 'drizzle-orm'
import { db } from '../db'
import { songs } from '../db/schema'
import { Visibility } from '../types'

// ============================================================
// DTO 型定義
// ============================================================

type SongListItemDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  updatedAt: Date
}

type SongDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  bpm: number | null
  timeSignature: string
  content: unknown
  visibility: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// ヘルパー
// ============================================================

const toSongListItemDto = (song: typeof songs.$inferSelect): SongListItemDto => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  key: song.key,
  updatedAt: song.updatedAt,
})

const toSongDto = (song: typeof songs.$inferSelect): SongDto => {
  let content: unknown
  try {
    content = JSON.parse(song.content)
  } catch {
    content = song.content
  }

  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    key: song.key,
    bpm: song.bpm,
    timeSignature: song.timeSignature,
    content,
    visibility: song.visibility,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
  }
}

// ============================================================
// サービス関数
// ============================================================

/**
 * 公開曲の一覧を取得する。
 */
const listSongs = async (): Promise<SongListItemDto[]> => {
  const results = await db
    .select()
    .from(songs)
    .where(eq(songs.visibility, Visibility.Public))
    .orderBy(desc(songs.updatedAt))

  return results.map(toSongListItemDto)
}

/**
 * 公開曲をタイトル・アーティスト・キーで検索する。
 */
const searchSongs = async (query: string): Promise<SongListItemDto[]> => {
  const pattern = `%${query}%`

  const results = await db
    .select()
    .from(songs)
    .where(
      and(
        eq(songs.visibility, Visibility.Public),
        or(
          ilike(songs.title, pattern),
          ilike(songs.artist, pattern),
          ilike(songs.key, pattern)
        )
      )
    )
    .orderBy(desc(songs.updatedAt))

  return results.map(toSongListItemDto)
}

/**
 * IDで曲を取得する。
 * - 認証済み: 自分の曲 OR 公開 OR URL限定公開
 * - 匿名: 公開曲のみ
 */
const getSongById = async (
  id: string,
  userId?: string
): Promise<SongDto | null> => {
  const visibilityCondition = userId
    ? or(
        eq(songs.userId, userId),
        eq(songs.visibility, Visibility.Public),
        eq(songs.visibility, Visibility.UrlOnly)
      )
    : eq(songs.visibility, Visibility.Public)

  const results = await db
    .select()
    .from(songs)
    .where(and(eq(songs.id, id), visibilityCondition))
    .limit(1)

  if (results.length === 0) {
    return null
  }

  return toSongDto(results[0])
}

/**
 * 新しい曲を作成する。
 */
const createSong = async (
  userId: string,
  data: {
    title: string
    artist?: string | null
    key?: string | null
    bpm?: number | null
    timeSignature?: string
  }
): Promise<SongDto> => {
  const now = new Date()

  const results = await db
    .insert(songs)
    .values({
      userId,
      title: data.title,
      artist: data.artist ?? null,
      key: data.key ?? null,
      bpm: data.bpm ?? null,
      timeSignature: data.timeSignature ?? '4/4',
      content: '[]',
      visibility: Visibility.Private,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return toSongDto(results[0])
}

/**
 * 曲を更新する。所有者のみ更新可能。
 */
const updateSong = async (
  id: string,
  userId: string,
  data: {
    title: string
    artist?: string | null
    key?: string | null
    bpm?: number | null
    timeSignature?: string
    content?: string
  }
): Promise<SongDto | null> => {
  const now = new Date()

  const results = await db
    .update(songs)
    .set({
      title: data.title,
      artist: data.artist ?? null,
      key: data.key ?? null,
      bpm: data.bpm ?? null,
      timeSignature: data.timeSignature ?? '4/4',
      ...(data.content !== undefined ? { content: data.content } : {}),
      updatedAt: now,
    })
    .where(and(eq(songs.id, id), eq(songs.userId, userId)))
    .returning()

  if (results.length === 0) {
    return null
  }

  return toSongDto(results[0])
}

/**
 * 曲を削除する。所有者のみ削除可能。
 */
const deleteSong = async (id: string, userId: string): Promise<boolean> => {
  const results = await db
    .delete(songs)
    .where(and(eq(songs.id, id), eq(songs.userId, userId)))
    .returning({ id: songs.id })

  return results.length > 0
}

export const songService = {
  listSongs,
  searchSongs,
  getSongById,
  createSong,
  updateSong,
  deleteSong,
}
