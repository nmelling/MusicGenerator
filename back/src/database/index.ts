import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import path from 'path'

import * as music from './schema/music'
import * as order from './schema/order'
import * as auth from './schema/auth'

const __filename = fileURLToPath(import.meta.url)

const pool = new Pool({
  connectionString: Bun.env['DATABASE_URL']!,
})

const db = drizzle(pool, {
  schema: {
    ...music,
    ...order,
    ...auth,
  },
})

try {
  await migrate(db, {
    migrationsFolder: path.join(path.dirname(__filename), './migration'),
  })
} catch (err) {
  console.error(err) // use a real logger later
  process.exit(1)
}

export default db
