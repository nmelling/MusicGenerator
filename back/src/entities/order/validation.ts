import { z } from 'zod'

export const lyricsPayloadSchema = z.object({
  systemPrompt: z.string().nonempty(),
  musicPrompt: z.string().nonempty(),
  answers: z
    .object({
      prompt: z.string().nonempty(),
      answer: z.string().nonempty(),
    })
    .array()
    .min(1),
})

export const orderLyricsPayloadSchema = lyricsPayloadSchema.pick({
  musicPrompt: true,
  answers: true,
})

export type OrderLyricsPayload = z.infer<typeof orderLyricsPayloadSchema>
export type LyricsPayload = z.infer<typeof lyricsPayloadSchema>
