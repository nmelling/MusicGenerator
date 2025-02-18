import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { reset } from 'drizzle-seed'
import path from 'node:path'
import { fileURLToPath } from 'url'

import * as music from '@/database/schema/music'
import * as order from '@/database/schema/order'
import * as auth from '@/database/schema/auth'

const __filename = fileURLToPath(import.meta.url)

const musicCategoryPrompts = [
  'Write an epic folk song about a warrior’s journey through a mystical land.',
  'Create a haunting ballad about a ghost trapped between worlds.',
  'Write a high-energy rock anthem about breaking free from the past and chasing a dream.',
  'Spit a fire rap about overcoming struggles and rising to the top.',
  'Write an emotional breakup song with a hopeful, uplifting twist.',
]

const musicCategories = [
  { name: 'EpicSong', deprecated: false },
  { name: 'HauntingBallad', deprecated: false },
  { name: 'RockSong', deprecated: false },
  { name: 'RapSong', deprecated: true },
  { name: 'EmotionalSong', deprecated: true },
].map((entry, index) => ({
  ...entry,
  prompt: musicCategoryPrompts[index],
  description: musicCategoryPrompts[index],
}))

const musicQuestionPrompts = [
  'Your best friend’s first name',
  'A childhood nickname someone used for you',
  'The name of a place that holds special memories for you',
  'A word that describes how you feel right now',
  'The last text message you sent',
  'A secret you’ve never told anyone',
  'The first song you remember loving',
  'An instrument you’d love to learn',
  'A music genre that represents your personality',
  'A famous musician or band you admire',
]

const musicQuestions = new Array(10).fill(null).map((_, index) => ({
  question: musicQuestionPrompts[index],
  prompt: musicQuestionPrompts[index],
  placeholder: musicQuestionPrompts[index].slice(0, 45),
  isRequired: index % 5 === 0,
  deprecated: index > 8,
}))

export type InsertedTestSeed = {
  musicCategories: music.MusicCategory[]
  musicQuestions: music.MusicQuestion[]
  musicCategoryQuestionPivots: music.MusicCategoryQuestionPivot[]
}


class MockDatabaseConnector {
  private $db
  private $schemas: {
    music: typeof music;
    order: typeof order;
    auth: typeof auth;
  }

  constructor() {
    this.$schemas = {
      music,
      order,
      auth,
    }

    const sqlite = new PGlite();

    this.$db = drizzle(
      sqlite,
      {
        schema: {
          ...music,
          ...order,
          ...auth,
        }
      }
    )
  }

  public get db() {
    return this.$db
  }

  public get schemas() {
    return this.$schemas
  }

  public async migrateLatest(): Promise<void> {
    try {
      await migrate(this.db, { migrationsFolder: path.join(path.dirname(__filename), '../../database/migration') })
    } catch (err) {
      console.error(err) // use a real logger later
      process.exit(1)
    }
  }

  public async resetAllSeeds() {
    await Promise.all(
      Object.values(this.$schemas).map((schema) => reset(this.db, schema))
    )
  }

  public async seed(): Promise<InsertedTestSeed> {
    // Seed music
    await this.resetAllSeeds()
    const inserted = await this.db.transaction(async (trx) => {
      const insertedCategories = await trx.insert(this.$schemas.music.musicCategory).values(musicCategories).returning()
      const insertedQuestions = await trx.insert(this.$schemas.music.musicQuestion).values(musicQuestions).returning()
      const insertedCategoryQuestionPivot = await trx.insert(this.$schemas.music.musicCategoryQuestionPivot).values([
        ...insertedQuestions.map((item, index) => ({
          categoryId: index % 2 === 0 ? insertedCategories[0].categoryId : insertedCategories[1].categoryId,
          questionId: item.questionId,
        })),
        ...insertedQuestions.filter((item) => !item.deprecated && !item.isRequired).map((item) => ({
          categoryId: insertedCategories[2].categoryId,
          questionId: item.questionId,
        }))
      ]).returning()

      return {
        musicCategories: insertedCategories,
        musicQuestions: insertedQuestions,
        musicCategoryQuestionPivots: insertedCategoryQuestionPivot,
      }
    })

    return inserted
  }
}

const dbConnector = new MockDatabaseConnector()

export { dbConnector }

export default dbConnector.db

export function mockFunctionWrapper () {
  return { default: dbConnector.db, dbConnector }
}
