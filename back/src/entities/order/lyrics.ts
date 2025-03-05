import Anthropic from '@anthropic-ai/sdk'
import { HTTPException } from 'hono/http-exception'
import { type LyricsPayload, lyricsPayloadSchema } from './validation'

export async function $generateLyrics(payload: LyricsPayload): Promise<string> {
  const apiKey = Bun.env['ANTHROPIC_API_KEY']
  if (!apiKey) throw new HTTPException(400, { message: 'MISSING_API_KEY' })

  const { success } = lyricsPayloadSchema.safeParse(payload)
  if (!success)
    throw new HTTPException(400, { message: 'INCORRECT_PAYLOAD_PROVIDED' })

  const anthropic = new Anthropic({ apiKey })

  let generatedLyics = ''
  try {
    const message: Anthropic.Message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      system: `
        ${payload.systemPrompt}
        Sépare chaque partie de la chanson (prompt suno, intro, couplet, refrain) par '\n\n'. Assure toi que chaque partie de type 'Couplet', 'Refrain', etc commence bien par [VERSE/CHORUS/INTRO/OUTRO/...]
      `,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `
                Tu trouveras ici les précisions concernant la chanson à générer :
                ${payload.musicPrompt}
                ${payload.answers.map((item) => `${item.prompt}: ${item.answer}`).join('\n')}
              `,
            },
          ],
        },
      ],
    })

    const responseContent = message.content[0]
    if ('text' in responseContent && typeof responseContent.text === 'string')
      generatedLyics = responseContent.text
  } catch (err) {
    // todo logger
    throw new HTTPException(400, { message: 'LYRICS_GENERATION_ERROR' })
  }

  return generatedLyics
}

export type ExtractedLyricParts = {
  sunoPrompt: string
  verses: string[]
  refrain: string
  layout: string[]
}

export function $extractLyricParts(lyrics: string): ExtractedLyricParts {
  if (!lyrics) throw new HTTPException(400, { message: 'NO_LYRICS_PROVIDED' })
  if (typeof lyrics !== 'string')
    throw new HTTPException(400, { message: 'WRONG_LYRICS_FORMAT' })

  const extracted: ExtractedLyricParts = {
    sunoPrompt: '',
    verses: [],
    refrain: '',
    layout: [],
  }

  const splitted = lyrics.split('\n\n')
  if (splitted.length === 1 && splitted[0] === lyrics) return extracted

  splitted.forEach((str) => {
    const lowered = str.toLowerCase()
    if (lowered.includes('suno') && !extracted.sunoPrompt)
      extracted.sunoPrompt = str

    const layoutIdentifier = str.match(/(\[\w*\s*\w*\])/i)?.[0]
    if (!layoutIdentifier) return

    extracted.layout.push(layoutIdentifier)
    if (layoutIdentifier.toLowerCase().includes('chorus')) {
      extracted.refrain = str
      return
    }
    extracted.verses.push(str)
  })

  return extracted
}
