import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import * as R from 'remeda';

import Order from '@/entities/order/order';
import { newOrderSchema, getOneOrderSchema } from '@/modules/order/validation';
import { generateNewLyricsPartSchema } from '@/entities/order/validation';

const routes = new Hono()
  .get('/one', zValidator('query', getOneOrderSchema), async (c) => {
    const validated = c.req.valid('query');

    const $order = new Order(validated.orderId);
    const order = await $order.order;
    return c.json(order, 201);
  })
  .patch(
    '/:orderId/lyrics',
    zValidator('param', getOneOrderSchema),
    zValidator('json', generateNewLyricsPartSchema),
    async (c) => {
      const { orderId } = c.req.valid('param');
      const validated = c.req.valid('json');

      try {
        const $order = new Order(orderId);
        await $order.generateNewLyricsPart(
          R.pick(validated, ['lyricsId', 'selectedParts'])
        );
      } catch (error) {
        // TODO: logger
        if (error instanceof HTTPException) {
          throw error;
        }
        throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' });
      }

      return c.text('OK', 200);
    }
  )
  .post('/new', zValidator('json', newOrderSchema), async (c) => {
    const validated = c.req.valid('json');
    const { email, answers, categoryId } = validated;

    const $order = new Order();

    try {
      await $order.createNewOrder(email, categoryId, answers);

      await $order.generateLyrics();
    } catch (err) {
      // TODO: logger
      throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' });
    }

    const order = await $order.order;
    return c.json({ orderId: order.orderId }, 201);
  });

export type OrderRoutes = typeof routes;

export default routes;
