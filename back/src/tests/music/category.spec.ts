import { expect, test, describe } from 'bun:test'
import type { MusicCategory } from '@/database/schema/music'

describe('Music category', () => {
  describe('List available categories', () => {
    test('No categories stored', () => {
      const musicCategories: MusicCategory[] = []
      expect(Array.isArray(musicCategories)).toBe(true)
      expect(musicCategories.length).toBe(0)
    })
    test('Only deprecated categories', () => {})
    test('One available category', () => {})
    test('Few deprecated/few availables', () => {})
  })

  describe('One specific category', () => {
    describe('Init class', () => {
      test('Without specifying a categoryId', () => {})
      test('Specifying a wrong categoryId', () => {})
      test('Specifying a correct categoryId', () => {})
    })
  })
})
