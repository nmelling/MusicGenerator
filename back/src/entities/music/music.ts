import * as R from 'remeda'
import db from '@/database/index'
import type { AggregatedCategory, MusicCategory } from '@/database/schema/music'

class Music {
  private $categoryId: number | null
  private $musicCategory: AggregatedCategory | null;

  constructor (categoryId?: number) {
    this.$categoryId = categoryId || null
    this.$musicCategory = null

    if (this.$categoryId) this.init()
  }

  private async init (): Promise<AggregatedCategory> {
    if (!this.$categoryId) throw new Error('NO_CATEGORY_ID')
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

    if (!$category) throw new Error('MUSIC_CATEGORY_NOT_FOUND')

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
}

export default Music
