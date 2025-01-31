import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { seed, reset } from "drizzle-seed";
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import path from 'path'

import * as music from './schema/music'
import * as order from './schema/order'
import * as auth from './schema/auth'

const __filename = fileURLToPath(import.meta.url)

class DatabaseConnector {
  private pool: Pool;
  private seeded = false;
  public db;

  constructor () {
    this.pool = new Pool({
      connectionString: Bun.env['DATABASE_URL']!,
    })
    this.db = drizzle(this.pool, {
      schema: {
        ...music,
        ...order,
        ...auth,
      },
    })
  }

  async migrateLatest(): Promise<void> {
    try {
      await migrate(this.db, {
        migrationsFolder: path.join(path.dirname(__filename), './migration'),
      })
    } catch (err) {
      console.error(err) // use a real logger later
      process.exit(1)
    }
  }

  async seedRandomly (count?: number): Promise<void> {
    if (this.seeded) return
    try {
      await reset(this.db, music)
      await seed(this.db, music, { count })
    } catch (err) {
      console.error(err) // use a real logger later
    }
  }
}

const db = new DatabaseConnector()

export default db
