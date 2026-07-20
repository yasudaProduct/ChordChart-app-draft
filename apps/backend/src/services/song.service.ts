import { eq, and, or, ilike, desc, isNotNull } from 'drizzle-orm'
import { db } from '../db'
import { songs } from '../db/schema'
import { aggregateArtistNames } from '../lib/artistName'
import { Visibility } from '../types'

/** アーティスト名サジェストで返す最大件数（一括取得してクライアント側で絞り込む前提）。 */
const ARTIST_SUGGESTION_LIMIT = 500

// ============================================================
// DTO 型定義
// ============================================================

export type SongListItemDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  updatedAt: Date
}

export type SongDto = {
  id: string
  title: string
  artist: string | null
  key: string | null
  bpm: number | null
  timeSignature: string
  content: unknown
  visibility: string
  isOwner: boolean
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

export const toSongDto = (song: typeof songs.$inferSelect, viewerId?: string): SongDto => {
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
    isOwner: viewerId !== undefined && song.userId === viewerId,
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
    .where(and(eq(songs.visibility, Visibility.Public), eq(songs.isDemo, false)))
    .orderBy(desc(songs.updatedAt))

  return results.map(toSongListItemDto)
}

/**
 * デモ用の曲一覧を取得する。
 */
const listDemoSongs = async (): Promise<SongListItemDto[]> => {
  const results = await db
    .select()
    .from(songs)
    .where(eq(songs.isDemo, true))
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
        eq(songs.isDemo, false),
        or(ilike(songs.title, pattern), ilike(songs.artist, pattern), ilike(songs.key, pattern))
      )
    )
    .orderBy(desc(songs.updatedAt))

  return results.map(toSongListItemDto)
}

/**
 * 公開曲のアーティスト名一覧を取得する（入力サジェスト用）。
 * 表記ゆれを正規化して重複排除し、登録数の多い順に最大 ARTIST_SUGGESTION_LIMIT 件返す。
 */
const listPublicArtists = async (): Promise<string[]> => {
  const results = await db
    .select({ artist: songs.artist })
    .from(songs)
    .where(
      and(eq(songs.visibility, Visibility.Public), eq(songs.isDemo, false), isNotNull(songs.artist))
    )
    .orderBy(desc(songs.updatedAt))

  return aggregateArtistNames(
    results.map((row) => row.artist),
    ARTIST_SUGGESTION_LIMIT
  )
}

/**
 * IDで曲を取得する。
 * - 認証済み: 自分の曲 OR 公開
 * - 匿名: 公開曲のみ
 *
 * URL限定公開（url_only）は共有トークン経由（shareService.resolveShareToken）でのみ
 * 閲覧できる。ID を知っているだけの第三者からは見えない。
 */
const getSongById = async (id: string, userId?: string): Promise<SongDto | null> => {
  const visibilityCondition = userId
    ? or(eq(songs.userId, userId), eq(songs.visibility, Visibility.Public))
    : eq(songs.visibility, Visibility.Public)

  const results = await db
    .select()
    .from(songs)
    .where(and(eq(songs.id, id), visibilityCondition))
    .limit(1)

  if (results.length === 0) {
    return null
  }

  return toSongDto(results[0], userId)
}

/**
 * 新しい曲を作成する。visibility 未指定時は非公開。
 */
const createSong = async (
  userId: string,
  data: {
    title: string
    artist?: string | null
    key?: string | null
    bpm?: number | null
    timeSignature?: string
    visibility?: Visibility
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
      content: '{"sections":[]}',
      visibility: data.visibility ?? Visibility.Private,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return toSongDto(results[0], userId)
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
    visibility?: Visibility
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
      ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
      updatedAt: now,
    })
    .where(and(eq(songs.id, id), eq(songs.userId, userId)))
    .returning()

  if (results.length === 0) {
    return null
  }

  return toSongDto(results[0], userId)
}

/**
 * 曲の公開範囲のみを変更する。所有者のみ変更可能。
 */
const updateSongVisibility = async (
  id: string,
  userId: string,
  visibility: Visibility
): Promise<SongDto | null> => {
  const results = await db
    .update(songs)
    .set({ visibility, updatedAt: new Date() })
    .where(and(eq(songs.id, id), eq(songs.userId, userId)))
    .returning()

  if (results.length === 0) {
    return null
  }

  return toSongDto(results[0], userId)
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

// ============================================================
// マイページ用
// ============================================================

type MySongSummaryDto = {
  total: number
  private: number
  urlOnly: number
  specificUsers: number
  public: number
}

/**
 * 自分の曲一覧を取得する（デモ除外、更新日の降順）。
 * limit を指定すると最近 N 件のみ返す。
 */
const listMySongs = async (userId: string, limit?: number): Promise<SongListItemDto[]> => {
  const baseQuery = db
    .select()
    .from(songs)
    .where(and(eq(songs.userId, userId), eq(songs.isDemo, false)))
    .orderBy(desc(songs.updatedAt))

  const results = limit !== undefined ? await baseQuery.limit(limit) : await baseQuery

  return results.map(toSongListItemDto)
}

/**
 * 自分の曲数を可視性別に集計する（デモ除外）。
 */
const getMySongSummary = async (userId: string): Promise<MySongSummaryDto> => {
  const results = await db
    .select()
    .from(songs)
    .where(and(eq(songs.userId, userId), eq(songs.isDemo, false)))

  const summary: MySongSummaryDto = {
    total: results.length,
    private: 0,
    urlOnly: 0,
    specificUsers: 0,
    public: 0,
  }

  for (const song of results) {
    switch (song.visibility) {
      case Visibility.Public:
        summary.public += 1
        break
      case Visibility.UrlOnly:
        summary.urlOnly += 1
        break
      case Visibility.SpecificUsers:
        summary.specificUsers += 1
        break
      default:
        summary.private += 1
        break
    }
  }

  return summary
}

export const songService = {
  listSongs,
  listDemoSongs,
  searchSongs,
  listPublicArtists,
  getSongById,
  createSong,
  updateSong,
  updateSongVisibility,
  deleteSong,
  listMySongs,
  getMySongSummary,
}
