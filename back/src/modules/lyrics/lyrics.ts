import { Hono } from 'hono'
import type { TeamSong } from '../../@types/lyrics'

const app = new Hono()

export async function generateLyrics (payload: TeamSong, apiKey: string | undefined): Promise<string> {
  if (!apiKey) throw new Error('No API_KEY provided')

  return Object.values(payload).join(' ')
}

app.post('/', async (c) => {
  const body = await c.req.json()
  const lyrics = await generateLyrics(body, Bun.env['ANTHROPIC_API_KEY'])
  return c.json(lyrics, 201)
})

export default app