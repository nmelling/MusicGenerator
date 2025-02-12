import Anthropic from '@anthropic-ai/sdk'
import db from '../../database/index'

type Answer = {
  prompt: string;
  answer: string;
}

type LyricPayload = {
  systemPrompt: string;
  answers: Answer[];
}

class Lyrics {
  private $orderId: number;
  private $lyrics: string;

  constructor (orderId: number) {
    this.$orderId = orderId;
    this.$lyrics = '';
  }

  public async generateLyrics (
    payload: LyricPayload,
    apiKey: string | undefined
  ): Promise<string> {
    if (!apiKey) throw new Error('No API_KEY provided')

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
      return responseContent.text
    }
    throw new Error('Temporary  type guard check')
  }

  public async getLyrics (): string {
    if (this.$lyrics) return this.$lyrics
    // call db
    // return await db.query.musicCategory.findFirst({
    //   where: (musicCategory, { eq }) => eq(musicCategory.categoryId, categoryId),
    // })
  }

  get lyrics () {
    return this.$lyrics
  }

}

export default Lyrics
