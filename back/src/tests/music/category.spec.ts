import { expect, mock, test, describe } from 'bun:test'
import { HTTPException } from 'hono/http-exception'
import { dbConnector, mockFunctionWrapper, type InsertedTestSeed } from '@/tests/mocks/dbConnector.mock'
import Music from '@/entities/music/music'
import type { AggregatedCategory } from '@/database/schema/music'

await dbConnector.migrateLatest()

mock.module('@/database/index', mockFunctionWrapper)

let insertedSeeds: InsertedTestSeed

describe('Music category', () => {
  describe('List available categories', () => {
    test('No categories stored', async () => {
      const musics = await Music.listAvailableCategories()

      expect(Array.isArray(musics)).toBe(true)
      expect(musics.length).toBe(0)
    })

    test('All available categories stored', async () => {
      insertedSeeds = await dbConnector.seed()
      const musics = await Music.listAvailableCategories()

      expect(Array.isArray(musics)).toBe(true)
      expect(musics.length).toBe(3)
      expect(musics.map((item) => item.name)).toEqual(insertedSeeds.musicCategories.filter((item) => !item.deprecated).map((item) => item.name))
    })

    test('Pagined list of available categories', async () => {}) // TODO
  })

  describe('One specific category', () => {
    describe('Init class', () => {
      test('Without specifying a categoryId', async () => {
        const $music = new Music(undefined as any)
        expect($music).toBeInstanceOf(Music)

        let error
        try {
          await $music.category          
        } catch (err) {
          error = err
        }

        expect(Boolean(error)).toBe(true)
        expect(error).toBeInstanceOf(HTTPException)
        if (error instanceof HTTPException) {
          expect(error.status).toBe(400)
          expect(error.message).toBe('NO_CATEGORY_ID')
        }
      })

      test('Specifying a wrong categoryId', async () => {
        let error
        const $music = new Music(999999)
        try {
          await $music.category          
        } catch (err) {
          error = err
        }

        expect($music).toBeInstanceOf(Music)
        expect(Boolean(error)).toBe(true)
        expect(error).toBeInstanceOf(HTTPException)
        if (error instanceof HTTPException) {
          expect(error.status).toBe(404)
          expect(error.message).toBe('MUSIC_CATEGORY_NOT_FOUND')
        }
      })

      test('Specifying a correct categoryId', async () => {
        const seededCategory = insertedSeeds.musicCategories[0]

        let error
        let musicCategory: AggregatedCategory | undefined 
        const $music = new Music(seededCategory.categoryId)

        try {
          musicCategory = await $music.category
        } catch (err) {
          error = err 
        }

        expect($music).toBeInstanceOf(Music)
        expect(Boolean(error)).toBe(false)
        expect(Boolean(musicCategory)).toBe(true)
        if (musicCategory) {
          expect(musicCategory.categoryId).toEqual(seededCategory.categoryId)
          expect(musicCategory.questions.map((item) => item.questionId)).toEqual(insertedSeeds.musicCategoryQuestionPivots.filter((item) => item.categoryId === seededCategory.categoryId).map((item) => item.questionId))
        }
      })
    })
  })
})
