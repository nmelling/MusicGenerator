import { expect, mock, test, describe } from 'bun:test';
import { HTTPException } from 'hono/http-exception';
import {
  dbConnector,
  mockFunctionWrapper,
  type InsertedTestSeed,
} from '@/tests/mocks/dbConnector.mock';
import Music from '@/entities/music/music';

await dbConnector.migrateLatest();
const insertedSeeds: InsertedTestSeed = await dbConnector.seed();

mock.module('@/database/index', mockFunctionWrapper);

describe('Music question', () => {
  describe('Answer assignation', () => {
    test('Assign on a unknown category questions', async () => {
      const $music = new Music(999999);

      let error;
      try {
        await $music.checkAndAssignAnswers([]);
      } catch (err) {
        error = err;
      }

      expect($music).toBeInstanceOf(Music);
      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(404);
        expect(error.message).toBe('MUSIC_CATEGORY_NOT_FOUND');
      }
    });

    test('Payload: Empty array of answers provided', async () => {
      const $music = new Music(insertedSeeds.musicCategories[0].categoryId);
      let error;

      try {
        await $music.checkAndAssignAnswers([]);
      } catch (err) {
        error = err;
      }

      expect($music).toBeInstanceOf(Music);
      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('INCORRECT_PAYLOAD_PROVIDED');
      }
    });

    test(`Payload: Wrong answer's format provided`, async () => {
      const $music = new Music(insertedSeeds.musicCategories[1].categoryId);
      let error;

      try {
        await $music.checkAndAssignAnswers([{ foo: 'bar' }] as any);
      } catch (err) {
        error = err;
      }

      expect($music).toBeInstanceOf(Music);
      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('INCORRECT_PAYLOAD_PROVIDED');
      }
    });

    test('Payload: Missing answers to required questions', async () => {
      const categoryId = insertedSeeds.musicCategories[1].categoryId;
      const onlyRequiredQuestionIds = insertedSeeds.musicQuestions
        .filter((item) => item.isRequired)
        .map((item) => item.questionId);
      const $music = new Music(categoryId);

      const answers = insertedSeeds.musicCategoryQuestionPivots
        .filter((pivot) => pivot.categoryId === categoryId)
        .map((pivot) => ({ questionId: pivot.questionId, answer: 'foobar' }))
        .filter((item) => !onlyRequiredQuestionIds.includes(item.questionId));

      let error;

      try {
        await $music.checkAndAssignAnswers(answers);
      } catch (err) {
        error = err;
      }

      expect($music).toBeInstanceOf(Music);
      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('MISSING_ANSWERS');
      }
    });

    test('Answers are correctly assigned', async () => {
      const categoryId = insertedSeeds.musicCategories[0].categoryId;
      const $music = new Music(categoryId);

      const answers = insertedSeeds.musicCategoryQuestionPivots
        .filter((pivot) => pivot.categoryId === categoryId)
        .map((pivot) => ({ questionId: pivot.questionId, answer: 'foobar' }));

      let error;
      let aggregatedQuestions;

      try {
        aggregatedQuestions = await $music.checkAndAssignAnswers(answers);
      } catch (err) {
        error = err;
      }

      expect($music).toBeInstanceOf(Music);
      expect(Boolean(error)).toBe(false);
      expect(Array.isArray(aggregatedQuestions)).toBe(true);
      if (Array.isArray(aggregatedQuestions)) {
        expect(aggregatedQuestions.length).toEqual(answers.length);
        expect(aggregatedQuestions.map((item) => item.questionId)).toEqual(
          answers.map((item) => item.questionId)
        );
      }
    });
  });
});
