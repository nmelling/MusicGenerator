import { expect, test, describe, mock } from 'bun:test'
import { generateLyrics } from '../entities/lyrics/lyrics'

const teamSongPayload = {
  category: 'TestIsAwesome',
  name: 'DreamTeam',
  description: 'Our best childhood friends',
  commonPoints: 'We known each other for a ery long time',
  musicalGenre: 'rock-n-roll',
  musicalSpecificity: 'female voice',
  email: 'mock+test@terascop.com',
}

describe('Generate lyrics', () => {
  test('Lyrics generation should fail if no api key defined into .env', async () => {
    expect(() => generateLyrics(teamSongPayload, undefined)).toThrow(
      'No API_KEY provided'
    )
  })

  test.skip("TeamSong: Generate some lyrics which contains some provided information data (real Claude API's call)", async () => {
    const result = await generateLyrics(
      teamSongPayload,
      Bun.env['ANTHROPIC_API_KEY']
    )
    expect(result).toBeTruthy()
    expect(result).toContain(teamSongPayload.name)
  })

  test('TeamSong: Generate some lyrics which contains some provided information data', async () => {
    type MessagePayload = {
      model: string
      max_tokens: number
      temperature: number
      system: string
      messages: {
        role: string
        content: {
          type: string
          text: string
        }[]
      }[]
    }

    mock.module('@anthropic-ai/sdk', () => {
      class Message {
        create(payload: MessagePayload) {
          return {
            content: [
              {
                text: payload.messages[0].content[0].text,
              },
            ],
          }
        }
      }

      class Anthropic {
        apiKey: string
        messages: Message

        constructor(payload: { apiKey: string }) {
          this.apiKey = payload.apiKey
          this.messages = new Message()
        }
      }

      return { default: Anthropic }
    })

    const result = await generateLyrics(teamSongPayload, 'test-fake-api-key')
    expect(result).toBeTruthy()
    expect(result).toContain(teamSongPayload.name)
  })
})
