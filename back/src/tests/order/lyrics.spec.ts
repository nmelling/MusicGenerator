import { expect, beforeEach, afterEach, test, describe, mock } from 'bun:test'
import { HTTPException } from 'hono/http-exception'
import anthropicMockWrapper from '@/tests/mocks/anthropic.mock'
import { $generateLyrics, $extractLyricParts, type ExtractedLyricParts } from '@/entities/order/lyrics'

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

describe('Lyrics extraction', () => {
  describe('Should fails', () => {
    test('No lyrics provided', () => {
      let error
      try {
        $extractLyricParts(undefined as any)
      } catch (err) {
        error = err
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('NO_LYRICS_PROVIDED')
      }
    })

    test('Empty lyrics provided', () => {
      let error
      try {
        $extractLyricParts('')
      } catch (err) {
        error = err
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('NO_LYRICS_PROVIDED')
      }
    })

    test('Wrong lyrics type provided', () => {
      let error
      try {
        $extractLyricParts(123 as any)
      } catch (err) {
        error = err
      }

      expect(Boolean(error)).toBe(true)
      expect(error).toBeInstanceOf(HTTPException)
      if (error instanceof HTTPException) {
        expect(error.status).toBe(400)
        expect(error.message).toBe('WRONG_LYRICS_FORMAT')
      }
    })
  })

  describe('Should succeed', () => {
    test('Returns empty data if lyrics is a simple string not well formatted', () => {
      let error
      let extracted: ExtractedLyricParts | undefined
      try {
        extracted = $extractLyricParts(mockResponses[0])
      } catch (err) {
        error = err
      }

      expect(Boolean(error)).toBe(false)
      expect(Boolean(extracted)).toBe(true)
      if (extracted) {
        expect(extracted.sunoPrompt).toBe('')
        expect(extracted.refrain).toBe('')
        expect(Array.isArray(extracted.verses)).toBe(true)
        expect(extracted.verses.length).toBe(0)
        expect(Array.isArray(extracted.layout)).toBe(true)
        expect(extracted.layout.length).toBe(0)
      }
    })

    test('Returns a correct extracted payload if lyrics are well formatted', () => {
      const wellFormattedResponse = `"Je vais créer une chanson metal romantique qui exprime des sentiments profonds.\n\nSUNO PROMPT:\n\"Create an emotional metal song with powerful guitar riffs, intense drums, and melodic vocals. Mix heavy verses with melodic chorus. Theme: expressing deep love and gratitude.\"\n\n[INTRO]\nHeavy riffs echo through the night\nYour kindness shines so bright\nThe memories we share\nShow how much you care\n\n[VERSE 1]\nThrough storms and thunder, you stood by my side\nYour gentle soul, there's nothing you need to hide\nEvery moment spent with you feels so right\nYour kindness guides me through the darkest night\n\n[CHORUS]\nYou're the light that never fades away\n(Never fades away!)\nYour heart of gold brightens every day\n(Every single day!)\nI need to tell you what I feel inside\nMy love for you I can no longer hide!\n\n[VERSE 2]\nRemember all those times we laughed and cried\nThe countless moments where our hearts collide\nYour warmth and kindness helped me grow so strong\nWith you beside me, I know where I belong\n\n[BRIDGE]\nThe fire burns inside my soul\n(Inside my soul!)\nYour love has made me whole\n(Made me whole!)\nI'll scream it from the mountain high\nMy love will never die!\n\n[CHORUS]\nYou're the light that never fades away\n(Never fades away!)\nYour heart of gold brightens every day\n(Every single day!)\nI need to tell you what I feel inside\nMy love for you I can no longer hide!\n\n[OUTRO]\nMy love for you will never die\n(Will never die!)\nForever yours until the end of time\n(End of time!)"`

      let error
      let extracted: ExtractedLyricParts | undefined
      try {
        extracted = $extractLyricParts(wellFormattedResponse)
      } catch (err) {
        error = err
      }

      console.log(extracted?.layout)

      expect(Boolean(error)).toBe(false)
      expect(Boolean(extracted)).toBe(true)
      if (extracted) {
        expect(extracted.sunoPrompt).toBe(`SUNO PROMPT:\n\"Create an emotional metal song with powerful guitar riffs, intense drums, and melodic vocals. Mix heavy verses with melodic chorus. Theme: expressing deep love and gratitude.\"`)
        expect(extracted.refrain).toBe(`[CHORUS]\nYou're the light that never fades away\n(Never fades away!)\nYour heart of gold brightens every day\n(Every single day!)\nI need to tell you what I feel inside\nMy love for you I can no longer hide!`)
        expect(Array.isArray(extracted.verses)).toBe(true)
        expect(extracted.verses.length).toBe(5)
        expect(Boolean(extracted.verses.find((str) => str === 'Je vais créer une chanson metal romantique qui exprime des sentiments profonds.'))).toBe(false)
        expect(Array.isArray(extracted.layout)).toBe(true)
        expect(extracted.layout.length).toBe(7)
        expect(extracted.layout).toEqual(expect.arrayContaining([
          '[INTRO]',
          '[VERSE 1]',
          '[CHORUS]',
          '[VERSE 2]',
          '[BRIDGE]',
          '[CHORUS]',
          '[OUTRO]',
        ]))
        // peut-être contrôler l'ordre du layout & son contenu
      }
    })
  })
})