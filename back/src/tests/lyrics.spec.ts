import { expect, test, describe } from "bun:test";
import { generateLyrics } from '../lyrics'

describe('Generate lyrics', () => {
  test(
    'Generate some lyrics',
    async () => {
      const result = await generateLyrics()
      expect(result).toBeTruthy()
    }
  )
})
