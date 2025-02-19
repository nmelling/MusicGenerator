import { expect, beforeEach, afterEach, test, describe, mock } from 'bun:test'
import { HTTPException } from 'hono/http-exception'
import anthropicMockWrapper from '@/tests/mocks/anthropic.mock'
import { $generateLyrics } from '@/entities/order/lyrics'

const correctPayload = {
  systemPrompt: 'Write a song splitted into intro/chorus & verses',
  musicPrompt: 'Write an epic folk song about a warrior’s journey through a mystical land.',
  answers: [
    { prompt: `The hero name is :`, answer: 'JackoLantern' },
    { prompt: 'Is he wearing an armor', answer: 'Yes' },
  ]
}

let mockResponses = [`Through misty lands, JackoLantern roams, His armored heart where fire glows.`]

beforeEach(() => {
  mock.module('@anthropic-ai/sdk', anthropicMockWrapper({ responses: mockResponses }))
})

afterEach(() => {
  mock.restore()
})

describe('Generate lyrics', async () => {
  describe('Should fails', async () => {
    test('No api key defined into .env', async () => {
      const currentApiKey = Bun.env['ANTHROPIC_API_KEY']
      delete Bun.env['ANTHROPIC_API_KEY']

      let error
      try {
        await $generateLyrics(correctPayload)
      } catch (err) {
        error = err
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('MISSING_API_KEY')
      }

      Bun.env['ANTHROPIC_API_KEY'] = currentApiKey
    })

    test('Payload incorrectly formatted, missing systemPrompt', async () => {
      let error
      try {
        await $generateLyrics({ answers: [{ prompt: 'foobar', answer: '' }] } as any)
      } catch (err) {
        error = err 
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('INCORRECT_PAYLOAD_PROVIDED')
      }
    })

    test('Payload incorrectly formatted, empty answer provided', async () => {
      let error
      try {
        await $generateLyrics({ systempPrompt: 'foobar', answers: [{ prompt: 'foobar', answer: '' }] } as any)
      } catch (err) {
        error = err 
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('INCORRECT_PAYLOAD_PROVIDED')
      }
    })

    test('Payload incorrectly formatted, no answer provided', async () => {
      let error
      try {
        await $generateLyrics({ systempPrompt: 'foobar', answers: [] } as any)
      } catch (err) {
        error = err 
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('INCORRECT_PAYLOAD_PROVIDED')
      }
    })

    test('Anthropic generation error', async () => {
      mock.module('@anthropic-ai/sdk', anthropicMockWrapper({ responses: mockResponses, messageGenerationThrow: true }))

      let error
      try {
        await $generateLyrics(correctPayload)
      } catch (err) {
        error = err 
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('LYRICS_GENERATION_ERROR')
      }
    })

    test('Incorrect anthropic response format should returns an empty string', async () => {
      mock.module('@anthropic-ai/sdk', anthropicMockWrapper({ responses: mockResponses, misformatResponse: true }))

      let error
      let generatedLyrics
      try {
        generatedLyrics = await $generateLyrics(correctPayload)
      } catch (err) {
        error = err 
      }

      expect(Boolean(error)).toBe(false)
      expect(generatedLyrics).toBe('')
    })
  })

  describe('Should succeed', () => {
    test('Generate correct lyrics', async () => {
      let error
      let generatedLyrics
      try {
        generatedLyrics = await $generateLyrics(correctPayload)
      } catch (err) {
        error = err 
      }

      expect(Boolean(error)).toBe(false)
      expect(generatedLyrics).toBe(mockResponses[0])
    })
  })
})