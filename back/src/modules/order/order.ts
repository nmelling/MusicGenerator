import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import * as R from 'remeda'

import Order from '@/entities/order/order'
import Music from '@/entities/music/music'
import { newOrderSchema } from './validation'


const app = new Hono()

app.post(
  '/',
  zValidator(
    'json',
    newOrderSchema,
  ),
  async (c) => {
    const validated = c.req.valid('json')
    const { email, answers, categoryId } = validated

    const $music = new Music(categoryId)
    const musicCategory = await $music.category
    if (!musicCategory) throw new HTTPException(400, { message: 'MUSIC_CATEGORY_NOT_FOUND' })

    const aggregatedAnswers = await $music.checkAndAssignAnswers(answers)
    const formattedAnswers = R.pipe(
      aggregatedAnswers,
      R.map((item) => R.pick(item, ['prompt', 'answer'])),
    )

    const $order = new Order()
  
    try {
      await $order.createNewOrder(email, categoryId, answers)

      await $order.generateLyrics({
        systemPrompt: musicCategory.prompt,
        answers: formattedAnswers,
      })
    } catch (err) {
      // TODO: logger
      throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' })
    }

    const order = await $order.order
    return c.json(order, 201)
  }
)

export default app