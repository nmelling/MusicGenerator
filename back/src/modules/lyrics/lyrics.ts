import { Hono } from 'hono'
import type { TeamSong } from '../../@types/lyrics'

const app = new Hono()

export async function generateLyrics (payload: TeamSong): Promise<string> {
  return 'some lyrics'
}

app.post('/', async (c) => {
  const body = await c.req.json()
  const lyrics = await generateLyrics(body)
  return c.json(lyrics, 201)
})

export default app