import { z } from 'zod'

export const lyricsPayloadSchema = z.object({
  systemPrompt: z.string(),
  answers: z.object({
    prompt: z.string().nonempty(),
    answer: z.string().nonempty(),
  }).array(),
})

export type LyricsPayload = z.infer<typeof lyricsPayloadSchema>