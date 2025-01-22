import { expect, test, describe } from "bun:test";
import { generateLyrics } from './lyrics'

describe('Generate lyrics', () => {
  test(
    'Lyrics generation should fail if no api key defined into .env',
    async () => {
      const teamSongPayload = {
        category: 'TestIsAwesome',
        name: 'DreamTeam',
        description: 'Our best childhood friends',
        commonPoints: 'We known each other for a ery long time',
        musicalGenre: 'rock-n-roll',
        musicalSpecificity: 'female voice',
        email: 'mock+test@terascop.com'
      }
      expect(() => generateLyrics(teamSongPayload, undefined)).toThrow('No API_KEY provided')
    }
  )

  test(
    'TeamSong: Generate some lyrics which contains some provided information data',
    async () => {
      const teamSongPayload = {
        category: 'TestIsAwesome',
        name: 'DreamTeam',
        description: 'Our best childhood friends',
        commonPoints: 'We known each other for a ery long time',
        musicalGenre: 'rock-n-roll',
        musicalSpecificity: 'female voice',
        email: 'mock+test@terascop.com'
      }
      const result = await generateLyrics(teamSongPayload, Bun.env['ANTHROPIC_API_KEY'])
      expect(result).toBeTruthy()
      expect(result).toContain(teamSongPayload.name)
      
    }
  )
})
