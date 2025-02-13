import { z } from 'zod'

export const answerSchema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string().nonempty(),
})

export const newOrderSchema = z.object({
  answers: answerSchema.array(),
  email: z.string(),
  categoryId: z.number().int().positive(),
})

export type NewOrderPayload = z.infer<typeof newOrderSchema>
export type AnswerPayload = z.infer<typeof answerSchema>