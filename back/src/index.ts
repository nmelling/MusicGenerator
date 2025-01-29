import { Hono } from 'hono'
import { migrateDb } from './database'
import lyrics from './modules/music/lyrics'

const app = new Hono()

await migrateDb()

app.route('/lyrics', lyrics)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
