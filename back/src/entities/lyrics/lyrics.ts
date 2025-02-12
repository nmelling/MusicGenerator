import Anthropic from '@anthropic-ai/sdk'
import { sql } from 'drizzle-orm'
import { dbConnector } from '@/database/index'
import db from '@/database/index'

type Answer = {
  prompt: string;
  answer: string;
}

type LyricPayload = {
  systemPrompt: string;
  answers: Answer[];
}

class Lyrics {
  private $orderId: string;
  private $lyrics: string;

  constructor (orderId: string) {
    this.$orderId = orderId;
    this.$lyrics = '';
    this.init()
  }

  public async generateLyrics (
    payload: LyricPayload,
  ): Promise<string> {
    const apiKey = Bun.env['ANTHROPIC_API_KEY']
    if (!apiKey) throw new Error('MISSING_API_KEY')

    const anthropic = new Anthropic({ apiKey })

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

    if ('text' in responseContent && typeof responseContent.text === 'string') {
      const { order } = dbConnector.schemas

      await db.transaction(async (trx) => {
        await trx.update(order.lyrics)
          .set({ deprecated: true })
          .where(sql`${order.lyrics.orderId} = ${this.$orderId}`)
  
        await trx.insert(order.lyrics)
          .values({ orderId: this.$orderId, lyrics: responseContent.text })
      })

      this.$lyrics = responseContent.text
      return this.$lyrics
    }
    throw new Error('INCORRECT_RESPONSE_FORMAT')
  }

  public async init (): Promise<void> {
    if (this.$lyrics) return

    const lyricsRow = await db.query.lyrics.findFirst({
      where: (lyrics, { eq, and }) => and(eq(lyrics.orderId, String(this.$orderId)), eq(lyrics.deprecated, false)),
    })

    if (!lyricsRow) return
    this.$lyrics = lyricsRow.lyrics
  }

  get lyrics () {
    return this.$lyrics
  }

}

export default Lyrics
