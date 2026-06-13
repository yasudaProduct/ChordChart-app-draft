import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { DEMO_USER, demoSongs } from './demoSongs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

/**
 * staging / 本番向けの非破壊的なデモデータ投入。
 *
 * - 既存ユーザーや楽曲は削除しない（`reset` を行わない）。
 * - デモ用の固定ユーザーと `isDemo: true` の曲のみを対象に冪等更新する。
 * - 何度実行してもデモ曲がコード定義と一致する状態に揃う。
 */
async function main() {
  console.log('Ensuring demo user...')
  await db
    .insert(schema.users)
    .values({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      displayName: DEMO_USER.displayName,
    })
    .onConflictDoNothing({ target: schema.users.id })

  console.log('Refreshing demo songs...')
  // デモ曲のみを入れ替える。実ユーザーの曲（isDemo=false）には触れない。
  await db.delete(schema.songs).where(eq(schema.songs.isDemo, true))

  const now = new Date()
  await db.insert(schema.songs).values(
    demoSongs.map((song) => ({
      userId: DEMO_USER.id,
      title: song.title,
      artist: song.artist,
      key: song.key,
      bpm: song.bpm,
      timeSignature: song.timeSignature,
      content: song.content,
      visibility: 'public' as const,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    }))
  )

  console.log(`Demo seeding complete! (${demoSongs.length} songs)`)
  await client.end()
  process.exit(0)
}

main().catch(async (err) => {
  console.error('Demo seeding failed:', err)
  await client.end().catch(() => {})
  process.exit(1)
})
