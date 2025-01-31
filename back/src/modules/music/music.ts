import { Hono } from 'hono'
import { z } from 'zod'
import db from '../../database/index'

const app = new Hono()

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

const allCategories = app.get('/', async (c) => {
  const musics = await listAvailableMusicCategories()
  return c.json(musics, 201)
})

const oneCategory = app.get('/category/:categoryId', async (c) => {
  const $categoryId = await c.req.param('categoryId')
  
  const schema = z.coerce.number().int().positive()
  const categoryId = schema.parse($categoryId)

  const musicCategory = await getMusicCategory(categoryId)
  return c.json(musicCategory, 201)
})

export type AllCategories = typeof allCategories
export type OneCategory = typeof oneCategory

export default app
