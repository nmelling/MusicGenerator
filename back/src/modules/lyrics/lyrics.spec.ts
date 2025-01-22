import { expect, test, describe } from "bun:test";
import { generateLyrics } from './lyrics'

describe('Generate lyrics', () => {
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
      const result = await generateLyrics(teamSongPayload)
      expect(result).toBeTruthy()
      expect(result).toContainValues(Object.values(teamSongPayload))
    }
  )
})
