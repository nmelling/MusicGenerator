import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'

import Order from '@/entities/order/order'
import Music from '@/entities/music/music'
import { answerSchema } from './validation'


const app = new Hono()

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      answers: answerSchema.array(),
      email: z.string(),
      categoryId: z.number().int().positive(),
    })
  ),
  async (c) => {
    const validated = c.req.valid('json')
    const { email, answers, categoryId } = validated

    const $music = new Music(categoryId)
    const musicCategory = await $music.category
    if (!musicCategory) throw new HTTPException(400, { message: 'MUSIC_CATEGORY_NOT_FOUND' })
    // todo vérification des questionIds (bien liés à la catégorie)

    const $order = new Order()

    try {
      await $order.createNewOrder(email, categoryId, answers)
      // await $order.generateLyrics({
      //   systemPrompt: musicCategory.prompt,
      // })
    } catch (err) {
      // TODO: logger
      throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' })
    }

    // await lyrics.generateLyrics()
    // generateLyrics

    // Fetch des prompts formulaire/question
    // Définition d'une payload claire
    return c.json(order, 201)
  }
)

export default app