import { expect, beforeEach, afterEach, test, describe, mock } from 'bun:test';
import { HTTPException } from 'hono/http-exception';
import {
  correctPayload,
  mockResponses,
  wellFormattedGeneratedLyrics,
} from '@/tests/mocks/anthropic.mock';
import anthropicMockWrapper from '@/tests/mocks/anthropic.mock';
import {
  $generateLyrics,
  $extractLyricParts,
  type ExtractedLyricParts,
} from '@/entities/order/lyrics';

beforeEach(() => {
  mock.module(
    '@anthropic-ai/sdk',
    anthropicMockWrapper({ responses: mockResponses })
  );
});

afterEach(() => {
  mock.restore();
});

describe('Generate lyrics', async () => {
  describe('Should fails', async () => {
    test('No api key defined into .env', async () => {
      const currentApiKey = Bun.env['ANTHROPIC_API_KEY'];
      delete Bun.env['ANTHROPIC_API_KEY'];

      let error;
      try {
        await $generateLyrics(correctPayload);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('MISSING_API_KEY');
      }

      Bun.env['ANTHROPIC_API_KEY'] = currentApiKey;
    });

    test('Payload incorrectly formatted, missing systemPrompt', async () => {
      let error;
      try {
        await $generateLyrics({
          answers: [{ prompt: 'foobar', answer: '' }],
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

    test('Payload incorrectly formatted, empty answer provided', async () => {
      let error;
      try {
        await $generateLyrics({
          systempPrompt: 'foobar',
          answers: [{ prompt: 'foobar', answer: '' }],
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

    test('Payload incorrectly formatted, no answer provided', async () => {
      let error;
      try {
        await $generateLyrics({ systempPrompt: 'foobar', answers: [] } as any);
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

    test('Anthropic generation error', async () => {
      mock.module(
        '@anthropic-ai/sdk',
        anthropicMockWrapper({
          responses: mockResponses,
          messageGenerationThrow: true,
        })
      );

      let error;
      try {
        await $generateLyrics(correctPayload);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('LYRICS_GENERATION_ERROR');
      }
    });

    test('Incorrect anthropic response format should returns an empty string', async () => {
      mock.module(
        '@anthropic-ai/sdk',
        anthropicMockWrapper({
          responses: mockResponses,
          misformatResponse: true,
        })
      );

      let error;
      let generatedLyrics;
      try {
        generatedLyrics = await $generateLyrics(correctPayload);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(false);
      expect(generatedLyrics).toBe('');
    });
  });

  describe('Should succeed', () => {
    test('Generate correct lyrics', async () => {
      let error;
      let generatedLyrics;
      try {
        generatedLyrics = await $generateLyrics(correctPayload);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(false);
      expect(generatedLyrics).toBe(mockResponses[0]);
    });
  });
});

describe('Lyrics extraction', () => {
  describe('Should fails', () => {
    test('No lyrics provided', () => {
      let error;
      try {
        $extractLyricParts(undefined as any);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('NO_LYRICS_PROVIDED');
      }
    });

    test('Empty lyrics provided', () => {
      let error;
      try {
        $extractLyricParts('');
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('NO_LYRICS_PROVIDED');
      }
    });

    test('Wrong lyrics type provided', () => {
      let error;
      try {
        $extractLyricParts(123 as any);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(true);
      expect(error).toBeInstanceOf(HTTPException);
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400);
        expect(error.message).toBe('WRONG_LYRICS_FORMAT');
      }
    });
  });

  describe('Should succeed', () => {
    test('Returns empty data if lyrics is a simple string not well formatted', () => {
      let error;
      let extracted: ExtractedLyricParts | undefined;
      try {
        extracted = $extractLyricParts(mockResponses[0]);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(false);
      expect(Boolean(extracted)).toBe(true);
      if (extracted) {
        expect(extracted.sunoPrompt).toBe('');
        expect(extracted.refrain).toBe('');
        expect(Array.isArray(extracted.verses)).toBe(true);
        expect(extracted.verses.length).toBe(0);
        expect(Array.isArray(extracted.layout)).toBe(true);
        expect(extracted.layout.length).toBe(0);
      }
    });

    test('Returns a correct extracted payload if lyrics are well formatted', () => {
      let error;
      let extracted: ExtractedLyricParts | undefined;
      try {
        extracted = $extractLyricParts(wellFormattedGeneratedLyrics);
      } catch (err) {
        error = err;
      }

      expect(Boolean(error)).toBe(false);
      expect(Boolean(extracted)).toBe(true);
      if (extracted) {
        expect(extracted.sunoPrompt).toBe(
          `SUNO PROMPT:\n\"Create an emotional metal song with powerful guitar riffs, intense drums, and melodic vocals. Mix heavy verses with melodic chorus. Theme: expressing deep love and gratitude.\"`
        );
        expect(extracted.refrain).toBe(
          `[CHORUS]\nYou're the light that never fades away\n(Never fades away!)\nYour heart of gold brightens every day\n(Every single day!)\nI need to tell you what I feel inside\nMy love for you I can no longer hide!`
        );
        expect(Array.isArray(extracted.verses)).toBe(true);
        expect(extracted.verses.length).toBe(5);
        expect(
          Boolean(
            extracted.verses.find(
              (str) =>
                str ===
                'Je vais créer une chanson metal romantique qui exprime des sentiments profonds.'
            )
          )
        ).toBe(false);
        expect(Array.isArray(extracted.layout)).toBe(true);
        expect(extracted.layout.length).toBe(7);
        expect(extracted.layout).toEqual(
          expect.arrayContaining([
            '[INTRO]',
            '[VERSE 1]',
            '[CHORUS]',
            '[VERSE 2]',
            '[BRIDGE]',
            '[CHORUS]',
            '[OUTRO]',
          ])
        );
      }
    });
  });
});
