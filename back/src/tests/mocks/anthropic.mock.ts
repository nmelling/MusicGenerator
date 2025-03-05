type ExpectedResponse = {
  role: string
  content: {
    type: string
    text: string
  }[]
}

type MisformattedResponse = {
  role: string
  content: {
    type: string
    text: number
  }[]
}

type MessagePayload = {
  model: string
  max_tokens: number
  temperature: number
  system: string
  messages: ExpectedResponse[]
}

function mockAnthropic(
  $responses: string[],
  shouldThrow?: boolean,
  shouldMisformatResponse?: boolean
) {
  class Message {
    create(payload: MessagePayload): ExpectedResponse | MisformattedResponse {
      if (shouldThrow) throw new Error('SHOULD_THROW')
      if (shouldMisformatResponse) {
        return {
          role: 'user',
          content: [
            {
              type: 'number',
              text: 8,
            },
          ],
        }
      }

      let response: ExpectedResponse | undefined
      if ($responses.length) {
        response = {
          role: 'user',
          content: $responses.map((text) => ({
            type: 'text',
            text,
          })),
        }
      }

      return response || payload.messages[0]
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
}

function anthropicMockWrapper({
  responses,
  messageGenerationThrow,
  misformatResponse,
}: {
  responses: string[]
  messageGenerationThrow?: boolean
  misformatResponse?: boolean
}) {
  let $response: ExpectedResponse
  if (responses.length) {
    $response = {
      role: 'user',
      content: responses.map((text) => ({
        type: 'text',
        text,
      })),
    }
  }

  return () =>
    mockAnthropic(
      responses,
      Boolean(messageGenerationThrow),
      Boolean(misformatResponse)
    )
}

export const correctPayload = {
  systemPrompt: 'Write a song splitted into intro/chorus & verses',
  musicPrompt:
    'Write an epic folk song about a warrior’s journey through a mystical land.',
  answers: [
    { prompt: `The hero name is :`, answer: 'JackoLantern' },
    { prompt: 'Is he wearing an armor', answer: 'Yes' },
  ],
}

export const mockResponses = [
  `Through misty lands, JackoLantern roams, His armored heart where fire glows.`,
]
export const wellFormattedGeneratedLyrics = `"Je vais créer une chanson metal romantique qui exprime des sentiments profonds.\n\nSUNO PROMPT:\n\"Create an emotional metal song with powerful guitar riffs, intense drums, and melodic vocals. Mix heavy verses with melodic chorus. Theme: expressing deep love and gratitude.\"\n\n[INTRO]\nHeavy riffs echo through the night\nYour kindness shines so bright\nThe memories we share\nShow how much you care\n\n[VERSE 1]\nThrough storms and thunder, you stood by my side\nYour gentle soul, there's nothing you need to hide\nEvery moment spent with you feels so right\nYour kindness guides me through the darkest night\n\n[CHORUS]\nYou're the light that never fades away\n(Never fades away!)\nYour heart of gold brightens every day\n(Every single day!)\nI need to tell you what I feel inside\nMy love for you I can no longer hide!\n\n[VERSE 2]\nRemember all those times we laughed and cried\nThe countless moments where our hearts collide\nYour warmth and kindness helped me grow so strong\nWith you beside me, I know where I belong\n\n[BRIDGE]\nThe fire burns inside my soul\n(Inside my soul!)\nYour love has made me whole\n(Made me whole!)\nI'll scream it from the mountain high\nMy love will never die!\n\n[CHORUS]\nYou're the light that never fades away\n(Never fades away!)\nYour heart of gold brightens every day\n(Every single day!)\nI need to tell you what I feel inside\nMy love for you I can no longer hide!\n\n[OUTRO]\nMy love for you will never die\n(Will never die!)\nForever yours until the end of time\n(End of time!)"`

export default anthropicMockWrapper
