import { z } from 'zod'

export const answerSchema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string(),
})

export type AnswerPayload = z.infer<typeof answerSchema>