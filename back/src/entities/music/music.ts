import { HTTPException } from 'hono/http-exception'
import * as R from 'remeda'
import db from '@/database/index'
import type { AggregatedCategory, MusicCategory, MusicQuestion } from '@/database/schema/music'
import type { AnswerPayload } from '@/modules/order/validation'

class Music {
  private $categoryId: number | null
  private $musicCategory: AggregatedCategory | null;

  constructor (categoryId?: number) {
    this.$categoryId = categoryId || null
    this.$musicCategory = null

    if (this.$categoryId) this.init()
  }

  private async init (): Promise<AggregatedCategory> {
    if (!this.$categoryId) throw new HTTPException(400, { message: 'NO_CATEGORY_ID' })
    if (this.$musicCategory) return this.$musicCategory

    const $category = await db.query.musicCategory.findFirst({
      where: (musicCategory, { eq }) => eq(musicCategory.categoryId, Number(this.$categoryId)),
      with: {
        questions: {
          columns: {
            categoryId: false,
            questionId: false,
            position: true,
          },
          with: {
            question: true,
          },
        },
      },
    })

    if (!$category) throw new HTTPException(404, { message: 'MUSIC_CATEGORY_NOT_FOUND' })

    const category: AggregatedCategory = {
      ...R.omit($category, ['questions']),
      questions: [],
    }

    if (Array.isArray($category.questions)) {
      category.questions = R.pipe(
        $category.questions,
        R.filter((item) => Boolean(item.question)),
        R.sortBy([R.prop('position'), 'asc']),
        R.map(({ question }) => question),
      )
    }

    this.$musicCategory = category
    return this.$musicCategory
  }

  public static async listAvailableCategories (): Promise<MusicCategory[]> {
    return await db.query.musicCategory.findMany({
      where: (musicCategory, { eq }) => eq(musicCategory.deprecated, false)
    })
  }
  
  get category () {
    return this.init()
  }

  public async checkAndAssignAnswers (answers: AnswerPayload[]): Promise<Array<MusicQuestion & { answer: string }>> {
    if (!this.$musicCategory) await this.init()
    if (!this.$musicCategory) throw new HTTPException(404, { message: 'CATEGORY_NOT_FOUND' })

    const aggregatedQuestions = R.pipe(
      this.$musicCategory.questions,
      R.map((question) => ({
        ...question,
        answer: answers.find((answer) => answer.questionId)?.answer ?? '',
      }))
    )

    const missingAnswers = R.filter(aggregatedQuestions, (item) => Boolean(item.isRequired) && !item.deprecated && !item.answer)
    if (missingAnswers.length) throw new HTTPException(400, { message: 'MISSING_ANSWERS' }) 

    return aggregatedQuestions
  }
}

export default Music
