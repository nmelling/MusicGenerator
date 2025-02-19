import { nanoid } from 'nanoid'
import {
  char,
  index,
  integer,
  pgSchema,
  text,
  boolean,
  json,
} from 'drizzle-orm/pg-core'
import { relations, type InferSelectModel } from 'drizzle-orm'

import { order } from './order'
import timestamps from './timestamps'

export const lyricSchema = pgSchema('lyrics')

export const lyrics = lyricSchema.table(
  'lyrics',
  {
    lyricsId: char({ length: 20 })
    .primaryKey()
    .$default(() => nanoid(20)),
    orderId: char({ length: 20 })
      .notNull()
      .references(() => order.orderId),
    layout: json().notNull().default([]),
    deprecated: boolean().default(false),
    ...timestamps,
  },
  (table) => {
    return {
      orderIndex: index('order_index').on(table.orderId)
    }
  }
)

export const systemPrompt = lyricSchema.table(
  'systemPrompt',
  {
    systemPromptId: integer().primaryKey().generatedAlwaysAsIdentity(),
    prompt: text().notNull(),
  }
)

export const verse = lyricSchema.table(
  'verse',
  {
    verseId: char({ length: 20 })
    .primaryKey()
    .$default(() => nanoid(20)),
    lyricsId: char({ length: 20 }).references(() => lyrics.lyricsId).notNull(),
    text: text().notNull(),
    deprecated: boolean().default(false),
    ...timestamps,
  }
)

export const refrain = lyricSchema.table(
  'refrain',
  {
    refrainId: char({ length: 20 })
    .primaryKey()
    .$default(() => nanoid(20)),
    lyricsId: char({ length: 20 }).references(() => lyrics.lyricsId).notNull(),
    text: text().notNull(),
    ...timestamps,
  }
)

export const lyricsRelations = relations(lyrics, ({ one, many }) => ({
  order: one(order, {
    fields: [lyrics.orderId],
    references: [order.orderId],
  }),
  verses: many(verse),
  refrain: one(refrain, {
    fields: [lyrics.lyricsId],
    references: [refrain.refrainId],
  }),
}))

export const verseRelations = relations(verse, ({ one }) => ({
  lyric: one(lyrics, {
    fields: [verse.lyricsId],
    references: [lyrics.lyricsId],
  })
}))

export const refrainRelations = relations(refrain, ({ one }) => ({
  lyric: one(lyrics, {
    fields: [refrain.lyricsId],
    references: [lyrics.lyricsId],
  })
}))

export type SystemPrompt = InferSelectModel<typeof systemPrompt>
export type Lyrics = InferSelectModel<typeof lyrics>
export type Verse = InferSelectModel<typeof verse>
export type Refrain = InferSelectModel<typeof refrain>
export type AggregatedLyrics = Lyrics & {
  verses: Verse[]
  refrain: Refrain
}