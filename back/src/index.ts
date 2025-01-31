import { Hono } from 'hono'
import db from './database'
import music from './modules/music/music'
import lyrics from './modules/music/lyrics'

const app = new Hono()

await db.migrateLatest()
if (Bun.env['NODE_ENV'] === 'development') await db.seedRandomly()

app.route('/music', music)
app.route('/lyrics', lyrics)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
