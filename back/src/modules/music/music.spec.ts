import { expect, test, describe } from 'bun:test'
import type { MusicCategory } from '../../../../../shared/types/music'

// Init a test db? Or mock?
// Seeding
// realize tests

describe('List available categories', () => {
  test('Should return an empty array', () => {
    const musicCategories: MusicCategory[] = []
    expect(Array.isArray(musicCategories)).toBe(true)
    expect(musicCategories.length).toBe(0)
  })

  test.skip('Should return a list of music categories without forms & questions', () => {})
  test.skip('Should return a specific music category with forms & questions', () => {})
})
