import {
  pgSchema,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { order } from './order'

const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
}

export const musicSchema = pgSchema('music')

export const musicCategory = musicSchema.table('category', {
  categoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull(),
  description: varchar({ length: 255 }),
  prompt: text().notNull(),
  deprecated: boolean().default(false),
  ...timestamps,
})

export const musicQuestion = musicSchema.table('question', {
  questionId: integer().primaryKey().generatedAlwaysAsIdentity(),
  question: varchar({ length: 255 }).notNull(),
  placeholder: varchar({ length: 50 }),
  isRequired: boolean().default(false),
  deprecated: boolean().default(false),
  ...timestamps,
})

export const musicCategoryQuestionPivot = musicSchema.table(
  'categoryQuestionPivot',
  {
    categoryId: integer()
      .notNull()
      .references(() => musicCategory.categoryId),
    questionId: integer()
      .notNull()
      .references(() => musicQuestion.questionId),
    position: integer().notNull().default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.categoryId, t.questionId] }),
  })
)

// Relations

export const categoryOrderRelation = relations(musicCategory, ({ many }) => ({
  orders: many(order),
}))

export const categoryQuestionRelation = relations(musicCategory, ({ many }) => ({
  questions: many(musicCategoryQuestionPivot),
}))

export const questionCategoryRelation = relations(musicQuestion, ({ many }) => ({
  categories: many(musicCategoryQuestionPivot),
}))

export const categoryQuestionPivotRelation = relations(
  musicCategoryQuestionPivot,
  ({ one }) => ({
    question: one(musicQuestion, {
      fields: [musicCategoryQuestionPivot.questionId],
      references: [musicQuestion.questionId],
    }),
    category: one(musicCategory, {
      fields: [musicCategoryQuestionPivot.categoryId],
      references: [musicCategory.categoryId],
    }),
  })
)

// Peut-être ajouter de vraies tables de logs, à voir après prototypage
