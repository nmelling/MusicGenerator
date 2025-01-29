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

export const musicForm = musicSchema.table('form', {
  formId: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull(),
  deprecated: boolean().default(false),
  ...timestamps,
})

export const musicQuestion = musicSchema.table('question', {
  questionId: integer().primaryKey().generatedAlwaysAsIdentity(),
  question: varchar({ length: 50 }).notNull(),
  placeholder: varchar({ length: 50 }),
  deprecated: boolean().default(false),
  ...timestamps,
})

export const musicCategoryFormPivot = musicSchema.table(
  'categoryFormPivot',
  {
    categoryId: integer()
      .notNull()
      .references(() => musicCategory.categoryId),
    formId: integer()
      .notNull()
      .references(() => musicForm.formId),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.categoryId, t.formId] }),
  })
)

export const musicFormQuestionPivot = musicSchema.table(
  'formQuestionPivot',
  {
    formId: integer()
      .notNull()
      .references(() => musicForm.formId),
    questionId: integer()
      .notNull()
      .references(() => musicQuestion.questionId),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.formId, t.questionId] }),
  })
)

export const categoryOrderRelation = relations(musicCategory, ({ many }) => ({
  orders: many(order),
}))

export const categoryFormRelation = relations(musicCategory, ({ many }) => ({
  forms: many(musicCategoryFormPivot),
}))

export const formCategoryRelation = relations(musicForm, ({ many }) => ({
  categories: many(musicCategoryFormPivot),
}))

export const categoryFormPivotRelation = relations(
  musicCategoryFormPivot,
  ({ one }) => ({
    category: one(musicCategory, {
      fields: [musicCategoryFormPivot.categoryId],
      references: [musicCategory.categoryId],
    }),
    form: one(musicForm, {
      fields: [musicCategoryFormPivot.formId],
      references: [musicForm.formId],
    }),
  })
)

export const formQuestionRelation = relations(musicForm, ({ many }) => ({
  questions: many(musicFormQuestionPivot),
}))

export const questionFormRelation = relations(musicQuestion, ({ many }) => ({
  forms: many(musicCategoryFormPivot),
}))

export const formQuestionPivotRelation = relations(
  musicFormQuestionPivot,
  ({ one }) => ({
    question: one(musicQuestion, {
      fields: [musicFormQuestionPivot.questionId],
      references: [musicQuestion.questionId],
    }),
    form: one(musicForm, {
      fields: [musicFormQuestionPivot.formId],
      references: [musicForm.formId],
    }),
  })
)

// Peut-être ajouter de vraies tables de logs, à voir après prototypage
