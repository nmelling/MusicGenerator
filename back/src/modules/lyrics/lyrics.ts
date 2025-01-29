import { Hono } from 'hono'
import type { TeamSong } from '../../@types/lyrics'
import Anthropic from '@anthropic-ai/sdk'

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

app.post('/', async (c) => {
  const body = await c.req.json()
  const lyrics = await generateLyrics(body, Bun.env['ANTHROPIC_API_KEY'])
  return c.json(lyrics, 201)
})

export default app
