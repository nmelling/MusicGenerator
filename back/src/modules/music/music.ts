import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import Music from '@/entities/music/music'
import db from '@/database/index'
import { categoryIdSchema } from './validation'

export async function listAvailableMusicCategories() {
  // todo pagination
  return await db.query.musicCategory.findMany()
}

const app = new Hono()
.get('/category', async (c) => {
  const musics = await Music.listAvailableCategories()
  return c.json(musics, 201)
})
.get(
  '/category/:categoryId',
  zValidator(
    'param',
    categoryIdSchema,
  ),
  async (c) => {
  const { categoryId } = c.req.valid('param')

  const $music = new Music(categoryId)
  const musicCategory = await $music.category

  return c.json(musicCategory, 201)
})

export type MusicRoutes = typeof app

export default app
