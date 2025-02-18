import { Hono } from 'hono'
import * as R from 'remeda'
import { zValidator } from '@hono/zod-validator'
import Music from '@/entities/music/music'
import { categoryIdSchema } from './validation'
import type { MusicCategory } from '@/database/schema/music'

const routes = new Hono()
.get('/category', async (c) => {
  const $musics = await Music.listAvailableCategories()

  const musics: Pick<MusicCategory, 'categoryId' | 'name' | 'description'>[] = $musics.map((item) => R.pick(item, ['categoryId', 'name', 'description']))

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
  const $musicCategory = await $music.category

  const musicCategory = {
    ...R.pick($musicCategory, ['categoryId', 'description', 'name']),
    questions: R.pipe(
      $musicCategory.questions,
      R.filter((item) => !item.deprecated),
      R.map((item) => R.pick(item, ['isRequired', 'placeholder', 'question', 'questionId'])),
    )
  }

  return c.json(musicCategory, 201)
})

export type MusicRoutes = typeof routes

export default routes
