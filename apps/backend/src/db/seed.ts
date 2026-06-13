import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { reset, seed } from 'drizzle-seed'
import * as schema from './schema'
import { sampleSongContents } from './seedContent'
import { demoSongs } from './demoSongs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Am']
const timeSignatures = ['4/4', '3/4', '6/8']

async function main() {
  console.log('Resetting database...')
  await reset(db, schema)

  console.log('Seeding database...')
  await seed(db, schema).refine((f) => ({
    users: {
      count: 5,
      columns: {
        email: f.valuesFromArray({
          values: [
            'alice@example.com',
            'bob@example.com',
            'charlie@example.com',
            'dave@example.com',
            'eve@example.com',
          ],
        }),
        displayName: f.valuesFromArray({
          values: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'],
        }),
      },
    },
    songs: {
      count: 15,
      columns: {
        title: f.valuesFromArray({
          values: [
            'First Song',
            'Summer Breeze',
            'Midnight Rain',
            'Blue Sky',
            'Ocean Drive',
            'City Lights',
            'Morning Star',
            'Golden Hour',
            'Fading Echoes',
            'Silent Night',
            'Rising Sun',
            'Autumn Leaves',
            'Winter Song',
            'Spring Wind',
            'Night Walk',
          ],
        }),
        artist: f.valuesFromArray({
          values: ['The Band', 'Solo Artist', 'Jazz Trio', 'Rock Stars', 'Acoustic Duo'],
        }),
        key: f.valuesFromArray({ values: keys }),
        bpm: f.int({ minValue: 60, maxValue: 200 }),
        timeSignature: f.valuesFromArray({ values: timeSignatures }),
        content: f.valuesFromArray({ values: sampleSongContents }),
        visibility: f.valuesFromArray({
          values: ['private', 'url_only', 'specific_users', 'public'],
        }),
        // デモ用フラグはランダム生成させず、後段で明示的に作成するデモ曲のみ true にする
        isDemo: f.valuesFromArray({ values: [false] }),
      },
    },
    bookmarks: {
      count: 5,
    },
    songShares: {
      count: 3,
      columns: {
        shareToken: f.string({ isUnique: true }),
      },
    },
  }))

  console.log('Seeding demo songs...')
  const [demoOwner] = await db.select().from(schema.users).limit(1)
  if (!demoOwner) {
    console.error('No user found to own demo songs')
    process.exit(1)
  }

  const now = new Date()
  await db.insert(schema.songs).values(
    demoSongs.map((song) => ({
      userId: demoOwner.id,
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

  console.log('Seeding complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
