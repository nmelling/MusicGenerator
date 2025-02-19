import Anthropic from '@anthropic-ai/sdk'
import { HTTPException } from 'hono/http-exception'
import { type LyricsPayload, lyricsPayloadSchema } from './validation'

export async function $generateLyrics (payload: LyricsPayload): Promise<string> {
  const apiKey = Bun.env['ANTHROPIC_API_KEY']
  if (!apiKey) throw new HTTPException(400, { message: 'MISSING_API_KEY' })

  const { success } = lyricsPayloadSchema.safeParse(payload)
  if (!success) throw new HTTPException(400, { message: 'INCORRECT_PAYLOAD_PROVIDED' })

  const anthropic = new Anthropic({ apiKey })

  let generatedLyics = ''
  try {
    const message: Anthropic.Message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      system: payload.systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: payload.answers.map((item) => `${item.prompt}: ${item.answer}`).join('\n'),
            },
          ],
        },
      ],
    })

    const responseContent = message.content[0]
    if ('text' in responseContent && typeof responseContent.text === 'string') generatedLyics = responseContent.text
  } catch (err) {
    // todo logger
    throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' })
  }

  return generatedLyics
}