import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================
// Users テーブル
// ============================================================
export const users = pgTable('Users', {
  id: text('Id').primaryKey(),
  email: text('Email').notNull(),
  displayName: text('DisplayName'),
  avatarUrl: text('AvatarUrl'),
  createdAt: timestamp('CreatedAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('UpdatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ============================================================
// ENUM 定義
// ============================================================
export const visibilityEnum = pgEnum('visibility', [
  'private',
  'url_only',
  'specific_users',
  'public',
])

// ============================================================
// Songs テーブル
// ============================================================
export const songs = pgTable(
  'Songs',
  {
    id: uuid('Id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('UserId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('Title', { length: 200 }).notNull(),
    artist: varchar('Artist', { length: 200 }),
    key: varchar('Key', { length: 10 }),
    bpm: integer('Bpm'),
    timeSignature: varchar('TimeSignature', { length: 10 }).notNull().default('4/4'),
    content: text('Content').notNull().default('[]'),
    visibility: visibilityEnum('Visibility').notNull().default('private'),
    createdAt: timestamp('CreatedAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('UpdatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('IX_Songs_UserId').on(table.userId),
    index('IX_Songs_Visibility').on(table.visibility),
  ]
)

// ============================================================
// Bookmarks テーブル
// ============================================================
export const bookmarks = pgTable(
  'Bookmarks',
  {
    id: uuid('Id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('UserId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    songId: uuid('SongId')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    createdAt: timestamp('CreatedAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('UpdatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('IX_Bookmarks_UserId_SongId').on(table.userId, table.songId),
  ]
)

// ============================================================
// SongShares テーブル
// ============================================================
export const songShares = pgTable(
  'SongShares',
  {
    id: uuid('Id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    songId: uuid('SongId')
      .notNull()
      .references(() => songs.id, { onDelete: 'cascade' }),
    shareToken: text('ShareToken').notNull(),
    expiresAt: timestamp('ExpiresAt', { withTimezone: true }),
    createdAt: timestamp('CreatedAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('UpdatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('IX_SongShares_ShareToken').on(table.shareToken),
  ]
)

// ============================================================
// リレーション定義
// ============================================================
export const usersRelations = relations(users, ({ many }) => ({
  songs: many(songs),
  bookmarks: many(bookmarks),
}))

export const songsRelations = relations(songs, ({ one, many }) => ({
  user: one(users, {
    fields: [songs.userId],
    references: [users.id],
  }),
  shares: many(songShares),
  bookmarks: many(bookmarks),
}))

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [bookmarks.songId],
    references: [songs.id],
  }),
}))

export const songSharesRelations = relations(songShares, ({ one }) => ({
  song: one(songs, {
    fields: [songShares.songId],
    references: [songs.id],
  }),
}))
