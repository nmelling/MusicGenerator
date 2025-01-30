import { Hono } from 'hono'
import type { MusicCategory } from '../../@types/music'
import db from '../../database/index'

const app = new Hono()

export async function listAvailableMusicCategories(): Promise<MusicCategory[]> {
  const musics = await db.query.musicCategory.findMany({
    with: {
      forms: {
        columns: {
          position: true,
          formId: false,
          categoryId: false,
        },
        with: {
          form: {
            with: {
              questions: {
                columns: {
                  formId: false,
                  questionId: false,
                  position: true,
                },
                with: {
                  question: true,
                },
              },
            },
          },
        },
      },
    },
  })
  return musics
}

app.get('/', async (c) => {
  const musics = await listAvailableMusicCategories()
  return c.json(musics, 201)
})

export default app
