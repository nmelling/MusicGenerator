import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'
import path from 'path'

import schema from '@/database/schema/index'

const __filename = fileURLToPath(import.meta.url)

class DatabaseConnector {
  private pool: Pool
  private $db
  private $schemas: typeof schema

  constructor() {
    this.pool = new Pool({
      connectionString: Bun.env['DATABASE_URL']!,
    })
    this.$schemas = schema

    this.$db = drizzle(this.pool, {
      schema,
    })
  }

  public get db() {
    return this.$db
  }

  public get schemas() {
    return this.$schemas
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

  public async initSeed () {
    const rows = await this.db.select().from(this.schemas.musicCategory).limit(1)
    if (rows.length) return

    const musicSeeds = [
      {
        category: { name: `Love Song`, description: `Dire à quelqu un qu on l aime et se remémorer les souvenirs communs`, prompt: `Dire à quelqu un qu on l aime et se remémorer les souvenirs communs` },
        questions: [
          { question: `Quel est le prénom de la personne à qui la chanson est dédiée ?`, prompt: `Cette chanson s adresse à`, palceholder: `Nom de la star`, isRequired: true },
          { question: `Quel genre musical voulez-vous pour votre chanson ?`, prompt: `Voici le genre musical`, palceholder: `Ex: pop, rock, electro, piano ...`, isRequired: true },
          { question: `Quels sont les traits de caractère que tu apprécies le plus chez cette personne ?`, prompt: `Voici les traits notables du sujet de la chanson`, palceholder: `Ex: intelligence, gentillesse, courage`, isRequired: false },
        ]
      },
      {
        category: { name: `Team Song`, description: `Une musique pour rassembler un groupe d amis, de collègues ou sa famille`, prompt: `Une musique pour rassembler un groupe d amis, de collègues ou sa famille` },
        questions: [
          { question: `À quel type de groupe cette chanson s adresse-t-elle ?`, prompt: `Cette chanson s adresse au type de groupe suivant :`, palceholder: `Ex: groupe d amis, collègues de bureau, ...`, isRequired: true },
          { question: `Peux-tu dire ce que vous avez en commun dans ce groupe ?`, prompt: `Voici les points communs que nous partageons :`, palceholder: `Ex: l endroit où l on se rassemble, ...`, isRequired: false },
          { question: `Autres éléments sur le type de musique`, prompt: `Autres éléments sur le type de musique`, palceholder: `Ex: Chanteur homme, musique joyeuse, humour, ...`, isRequired: false },
        ],
      }
    ]

    await this.db.transaction(async (trx) => {
      await trx.insert(this.schemas.systemPrompt).values({
        prompt: `
        Bonjour Claude,
          je souhaite que tu m aides à créer des chansons originales avec des contraintes précises. Pour chaque chanson, je vais te donner :
          1. Le destinataire de la chanson
          2. Des informations personnelles sur cette personne
          3. Le contexte ou l occasion de la chanson
          4. Le genre musical souhaité
          5. Des éléments spécifiques à inclure
          Pour chaque chanson, tu devras :
          - Créer un prompt Suno en anglais sans noms d artistes (maximum 200 caractères)
          - Écrire les paroles avec des sections entre crochets (intro, couplet, refrain, etc.)
          - Adapter le style et le ton à la demande
          - Personnaliser au maximum le contenu
          - Proposer une chanson originale et mémorable
          Es-tu prêt à m aider à créer des chansons uniques ?
        `
      })

      for (const item of musicSeeds) {
        const [$category] = await trx.insert(this.schemas.musicCategory).values(item.category).returning()
        const $questions = await trx.insert(this.schemas.musicQuestion).values(item.questions).returning()
        await trx.insert(this.schemas.musicCategoryQuestionPivot).values($questions.map((question, index) => ({
          categoryId: $category.categoryId,
          questionId: question.questionId,
          position: index + 1,
        })))
      }
    })
  }
}

const dbConnector = new DatabaseConnector()

export { dbConnector }

export default dbConnector.db
