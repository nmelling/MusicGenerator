import { pick } from 'remeda'
import db from '@/database/index'
import { dbConnector } from '@/database/index'
import type { AggregatedOrder } from '@/database/schema/order'
import type { AnswerPayload } from '@/modules/order/validation'

class Order {
  $orderId: string;
  $order: AggregatedOrder | null;

  constructor(orderId?: string) {
    this.$orderId = orderId || ''
    this.$order = null

    if (orderId) this.initOrder()
  }

  get order () {
    return this.$order
  }

  public async initOrder () {
    if (!this.$orderId) throw new Error('NO_ORDER_ID')
    
    const order = await db.query.order.findFirst({
      where: (order, { eq }) => eq(order.orderId, String(this.$orderId)),
      with: {
        lyrics: true,
        answers: true,
      }
    })

    if (!order) throw new Error('ORDER_NOt_FOUND')
    this.$order = order

    return order
  }

  async createNewOrder (email: string, categoryId: number, answers: AnswerPayload[]): Promise<string> {
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

    this.$order = order
    return order.orderId
  }
}

export default Order
