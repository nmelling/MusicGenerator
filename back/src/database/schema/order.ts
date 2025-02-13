import { nanoid } from 'nanoid'
import {
  char,
  index,
  integer,
  pgSchema,
  text,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations, type InferSelectModel } from 'drizzle-orm'

import { musicQuestion, musicCategory } from './music'
import timestamps from './timestamps'

export const orderSchema = pgSchema('order')

export const order = orderSchema.table(
  'order',
  {
    orderId: char({ length: 20 })
      .primaryKey()
      .$default(() => nanoid(20)),
    categoryId: integer()
      .notNull()
      .references(() => musicCategory.categoryId),
    email: varchar({ length: 255 }).notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      emailIndex: index('email_index').on(table.email),
    }
  }
)

export const lyrics = orderSchema.table(
  'lyrics',
  {
    lyricsId: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: char({ length: 20 })
      .notNull()
      .references(() => order.orderId),
    lyrics: text().notNull(),
    deprecated: boolean().default(false),
    ...timestamps,
  },
  (table) => {
    return {
      orderIndex: index('order_index').on(table.orderId)
    }
  }
)

export const answer = orderSchema.table('answer', {
  answerId: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: char({ length: 20 })
      .notNull()
      .references(() => order.orderId),
  questionId: integer()
    .notNull()
    .references(() => musicQuestion.questionId),
  answer: text().notNull(),
  ...timestamps,
})

export const orderRelations = relations(order, ({ one, many }) => ({
  musicCategory: one(musicCategory, {
    fields: [order.categoryId],
    references: [musicCategory.categoryId],
  }),
  lyrics: many(lyrics),
  answers: many(answer),
}))

export const answerRelations = relations(answer, ({ one }) =>({
  question: one(musicQuestion, {
    fields: [answer.questionId],
    references: [musicQuestion.questionId],
  }),
  order: one(order, {
    fields: [answer.orderId],
    references: [order.orderId],
  }),
}))

export const lyricsRelations = relations(lyrics, ({ one }) => ({
  order: one(order, {
    fields: [lyrics.orderId],
    references: [order.orderId],
  })
}))


export type Order = InferSelectModel<typeof order>
export type Lyrics = InferSelectModel<typeof lyrics>
export type Answer = InferSelectModel<typeof answer>
export type AggregatedOrder = Order & {
  lyrics: Lyrics[]
  answers: Answer[]
}

// TODO: A définir plus tard, table pour stocker les infos liées au paiement
