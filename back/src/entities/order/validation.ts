import { z } from 'zod';

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
});

export const generateNewLyricsPartSchema = z.object({
  lyricsId: z.string().nonempty(),
  selectedParts: z.optional(z.string().nonempty().array().min(1)),
});

export type LyricsPayload = z.infer<typeof lyricsPayloadSchema>;
export type GenerateNewLyricsPart = z.infer<typeof generateNewLyricsPartSchema>;
