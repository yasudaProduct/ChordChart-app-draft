import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePostgresJs } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type DatabaseDriver = 'postgres-js' | 'neon-http'

function getDatabaseDriver(): DatabaseDriver {
  const driver = (process.env.DATABASE_DRIVER ?? 'postgres-js').trim() as DatabaseDriver
  if (driver !== 'postgres-js' && driver !== 'neon-http') {
    throw new Error('DATABASE_DRIVER must be "postgres-js" or "neon-http"')
  }
  return driver
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const databaseDriver = getDatabaseDriver()

export const db =
  databaseDriver === 'neon-http'
    ? drizzleNeonHttp(neon(connectionString), { schema })
    : drizzlePostgresJs(postgres(connectionString), { schema })
