import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { seed, reset } from 'drizzle-seed'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import path from 'path'

import * as music from './schema/music'
import * as order from './schema/order'
import * as auth from './schema/auth'

const __filename = fileURLToPath(import.meta.url)

class DatabaseConnector {
  private pool: Pool
  private seeded = false
  private $db

  constructor() {
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

  public async seedRandomly(): Promise<void> {
    if (this.seeded) return

    function defineIdList(count: number): number[] {
      return new Array(count).fill(null).map((_, index) => index + 1)
    }

    const ids = {
      musicCategory: defineIdList(5),
      musicQuestion: defineIdList(10),
    }

    const randomCategoryPrompts = [
      'Write a high-energy rock anthem about breaking free from the past and chasing a dream.',
      'Create a rebellious punk rock song about standing up to authority and fighting for what’s right.',
      'Write a classic rock ballad about a lost love that still haunts the singer.',
      'Spit a fire rap about overcoming struggles and rising to the top.',
      'Create a hip-hop track that tells a gritty street story with vivid imagery.',
      'Write a rap battle verse that showcases clever wordplay and sharp punchlines.',
      'Write a catchy pop song about the excitement of falling in love for the first time.',
      'Create a dance-pop anthem about living in the moment and forgetting all worries.',
      'Write an emotional breakup song with a hopeful, uplifting twist.',
      'Write a country song about a small-town love story with nostalgic vibes.',
      'Create a heartfelt ballad about losing a loved one and cherishing their memory.',
      'Write a fun, upbeat country song about a wild night out with friends.',
      'Write an emotional song about feeling alone in a crowded world.',
      'Create a deep, introspective song about battling inner demons and self-doubt.',
      'Write a melancholic song about watching someone drift away but being unable to stop it.',
      'Write a smooth R&B song about longing for someone who doesn’t notice you.',
      'Create a sensual slow jam about deep, passionate love.',
      'Write a soulful song about personal growth and healing after a tough breakup.',
      'Write an epic folk song about a warrior’s journey through a mystical land.',
      'Create a haunting ballad about a ghost trapped between worlds.',
      'Write a song from the perspective of the moon watching over the earth at night.',
    ]

    const randomQuestionPrompts = [
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
      'A song that makes you feel nostalgic',
      'A word that describes your dream song',
      'The name of the street you grew up on',
      'A city or country you’d love to visit',
      'A memory that always makes you smile',
      'A phrase your parents used to say often',
      'A life lesson you learned the hard way',
      'A color that represents your current mood',
      'The last food you ate',
      'Your favorite fictional character’s name',
      'The name of your first pet',
      'A number that feels lucky to you',
      'A word that rhymes with your first name',
      'A superpower you wish you had',
    ]

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
            prompt: funcs.valuesFromArray({
              values: randomCategoryPrompts,
            }),
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
            prompt: funcs.valuesFromArray({
              values: randomQuestionPrompts,
            }),
            question: funcs.loremIpsum(),
            placeholder: funcs.string(),
            isRequired: funcs.boolean(),
            deprecated: funcs.boolean(),
          },
        },
        musicCategoryQuestionPivot: {
          count: 10,
          columns: {
            categoryId: funcs.valuesFromArray({ values: ids.musicCategory }),
            questionId: funcs.valuesFromArray({
              values: ids.musicQuestion,
              isUnique: true,
            }),
          },
        },
      }))
    } catch (err) {
      console.error(err) // use a real logger later
    }
  }
}

const dbConnector = new DatabaseConnector()

export { dbConnector }

export default dbConnector.db
