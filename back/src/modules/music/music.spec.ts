import { expect, test, describe } from 'bun:test'
import type { MusicCategory } from '../../@types/music'

describe('List available categories', () => {
  test('Should return an empty array', () => {
    const musicCategories: MusicCategory[] = []
    expect(Array.isArray(musicCategories)).toBe(true)
    expect(musicCategories.length).toBe(0)
  })

  test.skip('Should return a list of music categories formatted as expected', () => {})
})
