import { Hono } from 'hono'
import Anthropic from '@anthropic-ai/sdk'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { TeamSong } from '../../../../shared/types/lyrics'

const app = new Hono()

export async function generateLyrics(
  payload: TeamSong,
  apiKey: string | undefined
): Promise<string> {
  if (!apiKey) throw new Error('No API_KEY provided')

  const anthropic = new Anthropic({ apiKey })

  const message: Anthropic.Message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0,
    system: 'Respond only with short poems saga in French.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Epic journey with a group of adventurers called ${payload.name}`,
          },
        ],
      },
    ],
  })

  const responseContent = message.content[0]

  if ('text' in responseContent && typeof responseContent.text === 'string') {
    return responseContent.text
  }
  throw new Error('Temporary  type guard check')
}

app.post(
  '/',
  zValidator(
    'form',
    z.object({
      forms: z.object({
        formId: z.number(),
        questions: z.object({
          questionId: z.number(),
          answer: z.string(),
        }).array(),
      }).array(),
    })
  ),
  async (c) => {
    // const body = await c.req.json()
    const validated = c.req.valid('form')

    // Fetch des prompts formulaire/question
    // Définition d'une payload claire

    const lyrics = await generateLyrics(body, Bun.env['ANTHROPIC_API_KEY'])
    return c.json(lyrics, 201)
  }
)

export default app
