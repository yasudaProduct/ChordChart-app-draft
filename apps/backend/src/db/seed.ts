import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { seed } from 'drizzle-seed'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client, { schema })

const sampleSections = [
  JSON.stringify([
    { type: 'section', name: 'Intro', bars: [{ chords: ['C', 'G', 'Am', 'F'] }] },
    { type: 'section', name: 'Verse', bars: [{ chords: ['Am', 'F', 'C', 'G'] }] },
    { type: 'section', name: 'Chorus', bars: [{ chords: ['F', 'G', 'C', 'Am'] }] },
  ]),
  JSON.stringify([
    { type: 'section', name: 'Intro', bars: [{ chords: ['Em', 'C', 'G', 'D'] }] },
    { type: 'section', name: 'Verse', bars: [{ chords: ['G', 'D', 'Em', 'C'] }] },
  ]),
  JSON.stringify([
    { type: 'section', name: 'Verse', bars: [{ chords: ['Dm', 'Bb', 'F', 'C'] }] },
    { type: 'section', name: 'Chorus', bars: [{ chords: ['Bb', 'C', 'F', 'Dm'] }] },
  ]),
]

const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Am']
const timeSignatures = ['4/4', '3/4', '6/8']

async function main() {
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
            'First Song', 'Summer Breeze', 'Midnight Rain',
            'Blue Sky', 'Ocean Drive', 'City Lights',
            'Morning Star', 'Golden Hour', 'Fading Echoes',
            'Silent Night', 'Rising Sun', 'Autumn Leaves',
            'Winter Song', 'Spring Wind', 'Night Walk',
          ],
        }),
        artist: f.valuesFromArray({
          values: [
            'The Band', 'Solo Artist', 'Jazz Trio',
            'Rock Stars', 'Acoustic Duo',
          ],
        }),
        key: f.valuesFromArray({ values: keys }),
        bpm: f.int({ minValue: 60, maxValue: 200 }),
        timeSignature: f.valuesFromArray({ values: timeSignatures }),
        content: f.valuesFromArray({ values: sampleSections }),
        visibility: f.valuesFromArray({ values: ['private', 'url_only', 'specific_users', 'public'] }),
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

  console.log('Seeding complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
