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
  private $db;

  constructor () {
    this.pool = new Pool({
      connectionString: Bun.env['DATABASE_URL']!,
    })
    this.$db = drizzle(this.pool, {
      schema: {
        ...music,
        ...order,
        ...auth,
      },
    })
  }

  public get db() {
    return this.$db
  } 

  public async migrateLatest(): Promise<void> {
    try {
      await migrate(this.db, {
        migrationsFolder: path.join(path.dirname(__filename), './migration'),
      })
    } catch (err) {
      console.error(err) // use a real logger later
      process.exit(1)
    }
  }

  public async seedRandomly (): Promise<void> {
    if (this.seeded) return

    function defineIdList (count: number): number[] {
      return new Array(count).fill(null).map((_, index) => index + 1)
    }

    const ids = {
      musicCategory: defineIdList(5),
      musicQuestion: defineIdList(10),
    }

    try {
      await reset(this.db, music)
      await seed(this.db, music).refine((funcs) => ({
        musicCategory: {
          count: 5,
          columns: {
            categoryId: funcs.int({
              minValue: 1,
              maxValue: ids.musicCategory.length,
              isUnique: true,
            }),
            name: funcs.string({
              isUnique: true,
            }),
            description: funcs.loremIpsum(),
            prompt: funcs.loremIpsum(),
            deprecated: funcs.boolean(),
          },
        },
        musicQuestion: {
          count: 10,
          columns: {
            questionId: funcs.int({
              minValue: 1,
              maxValue: ids.musicQuestion.length,
              isUnique: true,
            }),
            question: funcs.loremIpsum(),
            placeholder: funcs.string(),
            isRequired: funcs.boolean(),
            deprecated: funcs.boolean(),
          }
        },
        musicCategoryQuestionPivot: {
          count: 10,
          columns: {
            categoryId: funcs.valuesFromArray({ values: ids.musicCategory }),
            questionId: funcs.valuesFromArray({ values: ids.musicQuestion, isUnique: true }),
          }
        }
      }))
    } catch (err) {
      console.error(err) // use a real logger later
    }
  }
}

const dbConnector = new DatabaseConnector()

export { dbConnector }

export default dbConnector.db
