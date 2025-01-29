import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

import { Hono } from 'hono'
import lyrics from './modules/lyrics/lyrics'

import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)

const db = drizzle(Bun.env['DATABASE_URL']!)

try {
  await migrate(db, {
    migrationsFolder: path.join(
      path.dirname(__filename),
      './database/migration'
    ),
  })
} catch (err) {
  console.error(err) // use a real logger later
  process.exit(1)
}

const app = new Hono()

app.route('/lyrics', lyrics)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
