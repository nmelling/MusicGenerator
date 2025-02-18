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

function mockAnthropic ($responses: string[], shouldThrow?: boolean, shouldMisformatResponse?: boolean) {
  class Message {
    create(payload: MessagePayload): ExpectedResponse | MisformattedResponse {
      if (shouldThrow) throw new Error('SHOULD_THROW')
      if (shouldMisformatResponse) {
        return {
          role: 'user',
          content: [{
            type: 'number',
            text: 8
          }]
        }
      }

      let response: ExpectedResponse | undefined
      if ($responses.length) {
        response = {
          role: 'user',
          content: $responses.map((text) => ({
            type: 'text',
            text,
          }))
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

function anthropicMockWrapper ({ responses, messageGenerationThrow, misformatResponse }: { responses: string[], messageGenerationThrow?: boolean, misformatResponse?: boolean }) {
  let $response: ExpectedResponse
  if (responses.length) {
    $response = {
      role: 'user',
      content: responses.map((text) => ({
        type: 'text',
        text,
      }))
    }
  }

  return () => mockAnthropic(responses, Boolean(messageGenerationThrow), Boolean(misformatResponse))
}

export default anthropicMockWrapper