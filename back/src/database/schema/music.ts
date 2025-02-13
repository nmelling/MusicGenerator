import {
  pgSchema,
  integer,
  varchar,
  text,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations, type InferSelectModel } from 'drizzle-orm'
import timestamps from './timestamps'
import { order } from './order'

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
  prompt: text(),
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

export const categoryRelations = relations(musicCategory, ({ many }) => ({
  orders: many(order),
  questions: many(musicCategoryQuestionPivot),
}))

export const questionRelations = relations(musicQuestion, ({ many }) => ({
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

export type MusicCategory = InferSelectModel<typeof musicCategory>
export type MusicQuestion = InferSelectModel<typeof musicQuestion>
export type MusicCategoryQuestionPivot = InferSelectModel<typeof musicCategoryQuestionPivot>
export type AggregatedCategory = MusicCategory & {
  questions: MusicQuestion[]
}

// Peut-être ajouter de vraies tables de logs, à voir après prototypage
