import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import Order from '@/entities/order/order'
import { getMusicCategory } from '@/modules/music/music'
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

    const musicCategory = await getMusicCategory(categoryId)
    if (!musicCategory) throw new Error('MUSIC_CATEGORY_NOT_FOUND')
    // todo vérification des questionIds (bien liés à la catégorie)

    const $order = new Order()

    try {
      await $order.createNewOrder(email, categoryId, answers)
      // await $order.generateLyrics({
      //   systemPrompt: musicCategory.prompt,
      // })
    } catch (err) {
      
    }

    // await lyrics.generateLyrics()
    // generateLyrics

    // Fetch des prompts formulaire/question
    // Définition d'une payload claire
    return c.json(order, 201)
  }
)

export default app