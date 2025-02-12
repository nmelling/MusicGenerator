import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
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
      questions: {
        columns: {
          categoryId: false,
          questionId: false,
          position: true,
        },
        with: {
          question: true,
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
.get(
  '/category/:categoryId',
  zValidator(
    'param',
    z.object({
      categoryId: z.string().regex(/^\d+$/, 'Invalid categoryId').transform(Number),
    })
  ),
  async (c) => {
  const { categoryId } = c.req.valid('param')

  const musicCategory = await getMusicCategory(categoryId)
  return c.json(musicCategory, 201)
})

export type MusicRoutes = typeof app

export default app
