import { Hono } from 'hono'
import { dbConnector } from './database'
import music from './modules/music/music'
import lyrics from './modules/music/lyrics'

const app = new Hono()

await dbConnector.migrateLatest()
if (Bun.env['NODE_ENV'] === 'development') await dbConnector.seedRandomly()

app.route('/music', music)
app.route('/lyrics', lyrics)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
