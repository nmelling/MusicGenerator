import { expect, beforeEach, afterEach, test, describe, mock } from 'bun:test';
import * as R from 'remeda';
import { HTTPException } from 'hono/http-exception';
import {
  correctPayload,
  wellFormattedGeneratedLyrics,
} from '@/tests/mocks/anthropic.mock';
import anthropicMockWrapper from '@/tests/mocks/anthropic.mock';
import {
  dbConnector,
  mockFunctionWrapper,
  type InsertedTestSeed,
} from '@/tests/mocks/dbConnector.mock';
import db from '@/tests/mocks/dbConnector.mock';
import Order from '@/entities/order/order';

mock.module('@/database/index', mockFunctionWrapper);
mock.module(
  '@anthropic-ai/sdk',
  anthropicMockWrapper({ responses: [wellFormattedGeneratedLyrics] })
);

await dbConnector.migrateLatest();
let insertedSeeds: InsertedTestSeed = await dbConnector.seed();

const mockEmail = `test-${Date.now()}@gmail.com`;

async function createNewOrderWrapper() {
  const categoryId = insertedSeeds.musicCategories[0].categoryId;
  const answers = insertedSeeds.musicCategoryQuestionPivots
    .filter((item) => item.categoryId === categoryId)
    .map((item) => ({
      questionId: item.questionId,
      answer: 'foobar',
    }));

  const $order = new Order();
  await $order.createNewOrder(mockEmail, categoryId, answers);

  return { $order, answers, categoryId };
}

type CreatedOrder = Awaited<ReturnType<typeof createNewOrderWrapper>>;

describe('Order lyrics generation', async () => {
  let createdOrder: CreatedOrder;

  describe('should fails', () => {
    test('No order initialized', async () => {
      let error;
      const $order = new Order();

      try {
        await $order.generateLyrics();
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('ORDER_NOT_FOUND');
      }
      createdOrder = await createNewOrderWrapper();
    });

    test('No system prompt', async () => {
      if (!createdOrder) createdOrder = await createNewOrderWrapper();

      let error;
      await db.delete(dbConnector.schemas.systemPrompt);

      try {
        await createdOrder.$order.generateLyrics();
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(500);
        expect(error.message).toBe('INTERNAL_SERVER_ERROR');
      }

      await dbConnector.resetAllSeeds();
      insertedSeeds = await dbConnector.seed();
    });
  });

  describe('should succeed', () => {
    test('Got correct order with lyrics correctly stored', async () => {
      insertedSeeds = await dbConnector.seed();
      createdOrder = await createNewOrderWrapper();

      let error;
      try {
        await createdOrder.$order.generateLyrics();
      } catch (err) {
        error = err;
      }

      const order = await createdOrder.$order.order;

      expect(Boolean(error)).toBe(false);
      expect(Boolean(order)).toBe(true);
      expect(order.lyrics.length).toBe(1);
      expect(Boolean(order.lyrics[0].sunoPrompt)).toBe(true);
      expect(order.lyrics[0].verses.length).toBe(5);
      expect(order.lyrics[0].layout.length).toBe(7);
      expect(Boolean(order.lyrics[0].refrain)).toBe(true);
    });
  });
});
