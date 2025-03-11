import { expect, test, describe, mock, afterAll } from 'bun:test';
import * as R from 'remeda';
import { HTTPException } from 'hono/http-exception';
import { wellFormattedGeneratedLyrics } from '@/tests/mocks/anthropic.mock';
import anthropicMockWrapper from '@/tests/mocks/anthropic.mock';
import {
  dbConnector,
  mockFunctionWrapper,
  type InsertedTestSeed,
} from '@/tests/mocks/dbConnector.mock';
import db from '@/tests/mocks/dbConnector.mock';
import Order from '@/entities/order/order';
import { type LyricsPayload } from '@/entities/order/validation';
import type { AggregatedLyrics } from '@/database/schema/lyrics';

mock.module('@/database/index', mockFunctionWrapper);
mock.module(
  '@anthropic-ai/sdk',
  anthropicMockWrapper({ responses: [wellFormattedGeneratedLyrics] })
);

class TestableOrder extends Order {
  constructor(orderId?: string) {
    super(orderId);
  }

  public async formatLyricPayload() {
    return await this.$formatLyricPayload();
  }
}

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

  const $order = new TestableOrder();
  await $order.createNewOrder(mockEmail, categoryId, answers);

  return { $order, answers, categoryId };
}

type CreatedOrder = Awaited<ReturnType<typeof createNewOrderWrapper>>;

afterAll(async () => {
  await dbConnector.resetAllSeeds();
});

describe('Order lyrics generation', async () => {
  describe('format lyrics payload', () => {
    let createdOrder: CreatedOrder | undefined;

    describe('should fails', () => {
      test('No order initialized', async () => {
        let error;
        const $order = new TestableOrder();

        try {
          await $order.formatLyricPayload();
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
          await createdOrder.$order.formatLyricPayload();
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
      test('Got lyrics payload correctly formatted', async () => {
        await dbConnector.resetAllSeeds();
        insertedSeeds = await dbConnector.seed();
        createdOrder = await createNewOrderWrapper();

        let error;
        let formattedLyrics: LyricsPayload | undefined;
        try {
          formattedLyrics = await createdOrder.$order.formatLyricPayload();
        } catch (err) {
          error = err;
        }

        expect(Boolean(error)).toBe(false);
        expect(Boolean(formattedLyrics)).toBe(true);
        if (formattedLyrics) {
          expect(formattedLyrics.systemPrompt).toBe(
            insertedSeeds.systemPrompts[0].prompt
          );
          expect(formattedLyrics.musicPrompt).toBe(
            insertedSeeds.musicCategories[0].prompt
          );
          expect(Array.isArray(formattedLyrics.answers)).toBe(true);

          const answers = insertedSeeds.musicCategoryQuestionPivots
            .filter(
              (item) =>
                item.categoryId === insertedSeeds.musicCategories[0].categoryId
            )
            .map((pivot) => {
              const question = insertedSeeds.musicQuestions.find(
                (question) => question.questionId === pivot.questionId
              );
              return {
                prompt: question?.prompt,
                anwser: 'foobar',
              };
            });

          expect(formattedLyrics.answers.length).toBe(answers.length);
          expect(formattedLyrics.answers.map((item) => item.prompt)).toEqual(
            expect.arrayContaining(answers.map((item) => item.prompt))
          );
        }
      });
    });
  });

  describe('generate lyrics', () => {
    let createdOrder: CreatedOrder | undefined;

    describe('should fails', async () => {
      test('No suno prompt', async () => {
        if (!insertedSeeds) insertedSeeds = await dbConnector.seed();
        createdOrder = await createNewOrderWrapper();

        const missingSunoPrompt =
          '[VERSE 1]\nCeci est une chanson sans prompt suno';

        mock.module(
          '@anthropic-ai/sdk',
          anthropicMockWrapper({ responses: [missingSunoPrompt] })
        );

        let error;
        try {
          await createdOrder.$order.generateLyrics();
        } catch (err) {
          error = err;
        }

        expect(Boolean(error)).toBe(true);
        expect(error).toBeInstanceOf(HTTPException);
        if (error instanceof HTTPException) {
          expect(error.status).toBe(500);
          expect(error.message).toBe('WRONG_LYRICS_GENERATION');
        }
      });

      test('No layout.length', async () => {
        if (!insertedSeeds) insertedSeeds = await dbConnector.seed();
        createdOrder = await createNewOrderWrapper();

        const missingLayoutsResponse = 'Ceci est une chanson sans layouts';

        mock.module(
          '@anthropic-ai/sdk',
          anthropicMockWrapper({ responses: [missingLayoutsResponse] })
        );

        let error;
        try {
          await createdOrder.$order.generateLyrics();
        } catch (err) {
          error = err;
        }

        expect(Boolean(error)).toBe(true);
        expect(error).toBeInstanceOf(HTTPException);
        if (error instanceof HTTPException) {
          expect(error.status).toBe(500);
          expect(error.message).toBe('WRONG_LYRICS_GENERATION');
        }
      });
    });

    describe('should succeed', () => {
      test('Got correct order with lyrics correctly stored', async () => {
        insertedSeeds = await dbConnector.seed();
        createdOrder = await createNewOrderWrapper();

        mock.module(
          '@anthropic-ai/sdk',
          anthropicMockWrapper({ responses: [wellFormattedGeneratedLyrics] })
        );

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

  describe('Order lyrics update', async () => {
    insertedSeeds = await dbConnector.seed();
    let createdOrder = await createNewOrderWrapper();

    describe('should fails', () => {
      test('No payload provided', async () => {
        let error;

        try {
          await createdOrder.$order.generateNewLyricsPart(undefined as any);
        } catch (err) {
          error = err;
        }

        expect(Boolean(error)).toBe(true);
        expect(error).toBeInstanceOf(HTTPException);
        if (error instanceof HTTPException) {
          expect(error.status).toBe(400);
          expect(error.message).toBe('INCORRECT_PAYLOAD_PROVIDED');
        }
      });

      test('Incorrect payload provided', async () => {
        let error;

        try {
          await createdOrder.$order.generateNewLyricsPart({
            foo: 'bar',
          } as any);
        } catch (err) {
          error = err;
        }

        expect(Boolean(error)).toBe(true);
        expect(error).toBeInstanceOf(HTTPException);
        if (error instanceof HTTPException) {
          expect(error.status).toBe(400);
          expect(error.message).toBe('INCORRECT_PAYLOAD_PROVIDED');
        }
      });

      test('Incorrect lyricsId provided', async () => {
        createdOrder = await createNewOrderWrapper();
        let error;

        try {
          await createdOrder.$order.generateNewLyricsPart({
            lyricsId: 'bar',
          } as any);
        } catch (err) {
          error = err;
        }

        expect(Boolean(error)).toBe(true);
        expect(error).toBeInstanceOf(HTTPException);
        if (error instanceof HTTPException) {
          expect(error.status).toBe(404);
          expect(error.message).toBe('WRONG_LYRIC_PROVIDED');
        }
      });

      test.todo('updatable lyrics is deprecated', async () => {
        // todo: Seed un lyric deprecated
      });
    });

    describe('should succeed', async () => {
      test('No selected Parts length -> change all lyric parts', async () => {
        await dbConnector.resetAllSeeds();
        insertedSeeds = await dbConnector.seed();
        let createdOrder = await createNewOrderWrapper();
        await createdOrder.$order.generateLyrics();
        const lyrics = await createdOrder.$order.lyrics;
        if (!lyrics) {
          console.error('NO_LYRICS_GENERATED');
          return;
        }

        let error;
        let activeLyric: AggregatedLyrics | undefined;
        try {
          activeLyric = await createdOrder.$order.generateNewLyricsPart({
            lyricsId: lyrics.lyricsId,
          });
        } catch (err) {
          error = err;
        }

        const order = await createdOrder.$order.order;
        const deprecatedLyric = order.lyrics.find((item) => item.deprecated);

        expect(Boolean(error)).toBe(false);
        expect(Boolean(order)).toBe(true);
        expect(Boolean(activeLyric)).toBe(true);
        expect(Boolean(deprecatedLyric)).toBe(true);
        expect(order.lyrics.length).toBe(2);
      });

      test('Selected parts length -> Change only selected parts', async () => {
        await dbConnector.resetAllSeeds();
        insertedSeeds = await dbConnector.seed();
        let createdOrder = await createNewOrderWrapper();
        await createdOrder.$order.generateLyrics();
        const lyrics = await createdOrder.$order.lyrics;
        if (!lyrics) {
          console.error('NO_LYRICS_GENERATED');
          return;
        }

        let error;
        let activeLyric: AggregatedLyrics | undefined;
        try {
          activeLyric = await createdOrder.$order.generateNewLyricsPart({
            lyricsId: lyrics.lyricsId,
            selectedParts: ['[CHORUS]', '[VERSE 1]'],
          });
        } catch (err) {
          error = err;
        }

        const order = await createdOrder.$order.order;
        const deprecatedLyric = order.lyrics.find((item) => item.deprecated);

        expect(Boolean(error)).toBe(false);
        expect(Boolean(order)).toBe(true);
        expect(Boolean(activeLyric)).toBe(true);
        expect(Boolean(deprecatedLyric)).toBe(true);
        expect(order.lyrics.length).toBe(2);
        // TODO Check difference  between refrain & verse 1
      });
    });
  });
});
