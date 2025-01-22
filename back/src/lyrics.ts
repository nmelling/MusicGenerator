import { Hono } from 'hono'

const app = new Hono()

export async function generateLyrics (): Promise<string> {
  return 'some lyrics'
}

app.post('/', (c) => c.json('create an author', 201))

export default app