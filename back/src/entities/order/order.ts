import Anthropic from '@anthropic-ai/sdk'
import { sql } from 'drizzle-orm'

import db from '@/database/index'
import { dbConnector } from '@/database/index'
import type { AggregatedOrder, Lyrics } from '@/database/schema/order'
import type { AnswerPayload, LyricsPayload } from '@/modules/order/validation'
class Order {
  private $orderId: string;
  private $order: AggregatedOrder | null;

  constructor(orderId?: string) {
    this.$orderId = orderId || ''
    this.$order = null

    if (orderId) this.init()
  }

  private async init (): Promise<AggregatedOrder> {
    if (!this.$orderId) throw new Error('NO_ORDER_ID')
    
    const order = await db.query.order.findFirst({
      where: (order, { eq }) => eq(order.orderId, String(this.$orderId)),
      with: {
        lyrics: true,
        answers: true,
      }
    })

    if (!order) throw new Error('ORDER_NOT_FOUND')
    this.$order = order

    return order
  }

  public async createNewOrder (email: string, categoryId: number, answers: AnswerPayload[]): Promise<string> {
    const { order: orderSchema } = dbConnector.schemas

    const order = await db.transaction(async (trx) => {
      const [inserted] = await trx.insert(orderSchema.order)
      .values({ email, categoryId })
      .returning()

      await trx.insert(orderSchema.answer).values(answers.map((item) => ({ orderId: inserted.orderId, ...item })))

      const order = trx.query.order.findFirst({
        where: (order, { eq }) => eq(order.orderId, inserted.orderId),
        with: {
          answers: true,
        }
      })

      return order
    })

    if (!order) throw new Error('ORDER_NOT_GENERATED')

    this.$order = {
      ...order,
      lyrics: [],
      answers: [],
    }

    return order.orderId
  }

  public async generateLyrics (
    payload: LyricsPayload,
  ): Promise<Lyrics> {
    const apiKey = Bun.env['ANTHROPIC_API_KEY']
    if (!apiKey) throw new Error('MISSING_API_KEY')

    const anthropic = new Anthropic({ apiKey })

    let generatedLyics = ''

    try {
      const message: Anthropic.Message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0,
        system: payload.systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: payload.answers.map((item) => `${item.prompt}: ${item.answer}`).join('\n'),
              },
            ],
          },
        ],
      })

      const responseContent = message.content[0]
      if ('text' in responseContent && typeof responseContent.text === 'string') generatedLyics = responseContent.text
    } catch (err) {
      // todo logger
      throw new Error(`LYRICS_GENERATION_ERROR: ${JSON.stringify(err)}`)
    }

    if (!generatedLyics) throw new Error('LYRICS_GENERATION_EMPTY')

    const { order } = dbConnector.schemas

    const lyrics = await db.transaction(async (trx) => {
      await trx.update(order.lyrics)
        .set({ deprecated: true })
        .where(sql`${order.lyrics.orderId} = ${this.$orderId}`)

      await trx.insert(order.lyrics)
        .values({ orderId: this.$orderId, lyrics: generatedLyics })

      const lyrics = trx.select().from(order.lyrics).where(sql`${order.lyrics.orderId} = ${this.$orderId}`)

      return lyrics
    })

    if (this.$order) this.$order.lyrics = lyrics

    const activeLyrics = lyrics.find((item) => !item.deprecated)
    if (!activeLyrics) throw new Error('NO_ACTIVE_LYRICS')

    return activeLyrics
  }

  get order () {
    return this.init()
  }

  get lyrics (): Lyrics | null {
    if (!this.$order || !this.$order.lyrics) return null
    return this.$order.lyrics.find((item) => !item.deprecated) || null
  }
}

export default Order
