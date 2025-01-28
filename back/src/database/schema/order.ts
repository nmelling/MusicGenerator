import { nanoid } from 'nanoid';
import {
  char,
  index,
  integer,
  pgSchema,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

import { musicQuestion } from './music';

export const orderSchema = pgSchema('order');

export const order = orderSchema.table(
  "order", 
  {
    orderId: char({ length: 20 }).primaryKey().$default(() => nanoid(20)),
    email: varchar({ length: 255 }).notNull(),
  },
  (table) => {
    return {
      emailIndex: index("email_index").on(table.email),
    }
  }
)

export const answer = orderSchema.table(
  "answer",
  {
    answerId: integer().primaryKey().generatedAlwaysAsIdentity(),
    questionId: integer().notNull().references(() => musicQuestion.questionId),
    answer: text().notNull(),
  }
)

export const answerRelation = relations(answer, ({ one }) => ({
	question: one(musicQuestion, {
    fields: [answer.questionId],
    references: [musicQuestion.questionId],
  }),
}));

// TODO: A définir plus tard, table pour stocker les infos liées au paiement
