import { hc, type InferResponseType } from 'hono/client'
import { deepMap } from 'nanostores'

import type { MusicRoutes } from '@/../../back/src/modules/music/music'
import type { NewOrderPayload } from '@/../../back/src/modules/order/validation'

export const client = hc<MusicRoutes>('http://localhost:3000/api/music')
export type CategoryResponse = InferResponseType<
  typeof client.category.specific.$get
>;

export const $categoryForm = deepMap<
  Partial<NewOrderPayload> & Pick<NewOrderPayload, 'answers'>
>({
  categoryId: undefined,
  email: '',
  answers: [],
});

export function initCategoryForm({
  categoryId,
  questions,
}: Pick<CategoryResponse, 'categoryId' | 'questions'>): void {
  $categoryForm.setKey('categoryId', categoryId)
  $categoryForm.setKey(
    'answers',
    questions.map((question) => ({
      questionId: question.questionId,
      answer: '',
    }))
  );
}

export function setAnswer(answer: string, index: number): void {
  $categoryForm.setKey(`answers[${index}].answer`, answer)
}

export function setEmail(email: string): void {
  $categoryForm.setKey(`email`, email)
}
