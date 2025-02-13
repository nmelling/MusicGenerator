import { z } from 'zod'

export const answerSchema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string(),
})

export const lyricsPayloadSchema = z.object({
  systemPrompt: z.string(),
  answers: z.object({
    prompt: z.string(),
    answer: z.string(),
  }).array()
})

export type LyricsPayload = z.infer<typeof lyricsPayloadSchema>
export type AnswerPayload = z.infer<typeof answerSchema>