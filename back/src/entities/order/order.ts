import { sql, desc } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'

import db from '@/database/index'
import { dbConnector } from '@/database/index'
import type { AggregatedOrder } from '@/database/schema/order'
import type { AggregatedLyrics } from '@/database/schema/lyrics'
import type { AnswerPayload } from '@/modules/order/validation'
import { $generateLyrics } from '@/entities/order/lyrics'
import { type LyricsPayload } from '@/entities/order/validation'

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
        lyrics: {
          with: {
            verses: true,
            refrain: true,
          }
        },
        answers: true,
      }
    })

    if (!order) throw new HTTPException(404, { message: 'ORDER_NOT_FOUND' })
    this.$order = order

    return order
  }

  public async createNewOrder (email: string, categoryId: number, answers: AnswerPayload[]): Promise<string> {
    const order = await db.transaction(async (trx) => {
      const [inserted] = await trx.insert(dbConnector.schemas.order)
      .values({ email, categoryId })
      .returning()

      await trx.insert(dbConnector.schemas.answer).values(answers.map((item) => ({ orderId: inserted.orderId, ...item })))

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
    payload: Pick<LyricsPayload, 'musicPrompt' | 'answers'>,
  ): Promise<AggregatedLyrics> {
    const [systemPromptRow] = await db.select().from(dbConnector.schemas.systemPrompt).limit(1).orderBy(desc(dbConnector.schemas.systemPrompt.systemPromptId))
    if (!systemPromptRow) {
      // todo logger
      console.log('SYSTEM_PROMPT_NOT_FOUND')
      throw new HTTPException(500, { message: 'INTERNAL_SERVER_ERROR' })
    }

    const generatedLyrics = await $generateLyrics({ ...payload, systemPrompt: systemPromptRow.prompt })
    if (!generatedLyrics) throw new HTTPException(400, { message: 'LYRICS_GENERATION_EMPTY' })

    let lyrics: AggregatedLyrics[] = []

    try {
      lyrics = await db.transaction(async (trx) => {
        await trx.update(dbConnector.schemas.lyrics)
          .set({ deprecated: true })
          .where(sql`${dbConnector.schemas.lyrics.orderId} = ${this.$orderId}`)
  
        await trx.insert(dbConnector.schemas.lyrics)
          .values({ orderId: this.$orderId, lyrics: generatedLyrics })
  
        const lyrics = await trx.select().from(dbConnector.schemas.lyrics).where(sql`${dbConnector.schemas.lyrics.orderId} = ${this.$orderId}`)
  
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

  get lyrics (): AggregatedLyrics | null {
    if (!this.$order || !this.$order.lyrics) return null
    return this.$order.lyrics.find((item) => !item.deprecated) || null
  }
}

export default Order
