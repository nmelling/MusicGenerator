import { Hono } from 'hono'

import { z } from 'zod'
import db from '../../database/index'

export async function listAvailableMusicCategories() {
  // todo pagination
  return await db.query.musicCategory.findMany()
}

export async function getMusicCategory(categoryId: number){
  return await db.query.musicCategory.findFirst({
    where: (musicCategory, { eq }) => eq(musicCategory.categoryId, categoryId),
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
}

const app = new Hono()
.get('/category', async (c) => {
  const musics = await listAvailableMusicCategories()
  return c.json(musics, 201)
})
.get('/category/:categoryId', async (c) => {
  const $categoryId = await c.req.param('categoryId')
  
  const schema = z.coerce.number().int().positive()
  const categoryId = schema.parse($categoryId)

  const musicCategory = await getMusicCategory(categoryId)
  return c.json(musicCategory, 201)
})

export type MusicRoutes = typeof app

export default app
