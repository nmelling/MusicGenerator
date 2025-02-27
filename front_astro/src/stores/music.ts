import { hc, type InferResponseType } from 'hono/client'
import { atom } from 'nanostores';
import * as R from 'remeda'

import type { MusicRoutes } from '@/../../back/src/modules/music/music'
import type { NewOrderPayload } from '@/../../back/src/modules/order/validation'

export const client = hc<MusicRoutes>('http://localhost:3000/api/music')
export type CategoryResponse = InferResponseType<typeof client.category.specific.$get>

const $categoryForm = atom({})

export function initCategoryForm ({ categoryId, questions }: Pick<CategoryResponse, 'categoryId' | 'questions'>): void {
  $categoryForm.set()
}
