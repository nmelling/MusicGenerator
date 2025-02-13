import Anthropic from '@anthropic-ai/sdk'
import { sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'

import db from '@/database/index'
import { dbConnector } from '@/database/index'
import type { AggregatedOrder, Lyrics } from '@/database/schema/order'
import type { AnswerPayload } from '@/modules/order/validation'
import { type LyricsPayload, lyricsPayloadSchema } from './validation'
class Order {
  private $orderId: string;
  private $order: AggregatedOrder | null;

  constructor(orderId?: string) {
    this.$orderId = orderId || ''
    this.$order = null

    if (orderId) this.init()
  }

  private async init (): Promise<AggregatedOrder> {
    if (!this.$orderId) throw new HTTPException(400, { message: 'NO_ORDER_ID' })
    
    const order = await db.query.order.findFirst({
      where: (order, { eq }) => eq(order.orderId, String(this.$orderId)),
      with: {
        lyrics: true,
        answers: true,
      }
    })

    if (!order) throw new HTTPException(404, { message: 'ORDER_NOT_FOUND' })
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

    if (!order) throw new HTTPException(400, { message: 'ORDER_NOT_GENERATED' })

    this.$order = {
      ...order,
      lyrics: [],
      answers: [],
    }

    this.$orderId = order.orderId

    return order.orderId
  }

  public async generateLyrics (
    payload: LyricsPayload,
  ): Promise<Lyrics> {
    const apiKey = Bun.env['ANTHROPIC_API_KEY']
    if (!apiKey) throw new HTTPException(400, { message: 'MISSING_API_KEY' })

    const { success } = lyricsPayloadSchema.safeParse(payload)
    if (!success) throw new HTTPException(400, { message: 'INCORRECT_PAYLOAD_PROVIDED' })
 
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
      throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' })
    }

    if (!generatedLyics) throw new HTTPException(400, { message: 'LYRICS_GENERATION_EMPTY' })

    const { order } = dbConnector.schemas

    let lyrics: Lyrics[] = []

    try {
      lyrics = await db.transaction(async (trx) => {
        await trx.update(order.lyrics)
          .set({ deprecated: true })
          .where(sql`${order.lyrics.orderId} = ${this.$orderId}`)
  
        await trx.insert(order.lyrics)
          .values({ orderId: this.$orderId, lyrics: generatedLyics })
  
        const lyrics = await trx.select().from(order.lyrics).where(sql`${order.lyrics.orderId} = ${this.$orderId}`)
  
        return lyrics
      })
    } catch (err) {
      // todo: logger
      throw new HTTPException(500, { message: 'LYRICS_STORAGE_ERROR'})
    }

    if (this.$order) this.$order.lyrics = lyrics

    const activeLyrics = lyrics.find((item) => !item.deprecated)
    if (!activeLyrics) throw new HTTPException(404, { message: 'NO_ACTIVE_LYRICS' })

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
