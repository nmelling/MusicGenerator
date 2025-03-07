import { hc, type InferResponseType } from 'hono/client';
import { map, deepMap } from 'nanostores';
import { shared } from '@it-astro:request-nanostores';

import type { MusicRoutes } from '@/../../back/src/modules/music/music';
import type { NewOrderPayload } from '@/stores/order';

export const client = hc<MusicRoutes>('http://localhost:3000/api/music');
export type CategoryResponse = InferResponseType<
  typeof client.category.specific.$get
>;
export type Categories = InferResponseType<typeof client.category.$get>;

export const $availableCategories = shared(
  '$availableCategories',
  map<Categories>([])
);

export const $category = shared('$category', deepMap<CategoryResponse>());

export const $categoryForm = shared(
  '$categoryForm',
  deepMap<Partial<NewOrderPayload>>({
    categoryId: undefined,
    email: '',
    answers: [],
  })
);

export async function fetchAvailableCategories(): Promise<void> {
  // todo: pagination
  try {
    const res = await client.category.$get();
    if (res.ok) {
      const categories = await res.json();
      $availableCategories.set(categories);
    }
  } catch (err) {
    // toast erreur
  }
}

export async function fetchCategory(categoryId: number): Promise<void> {
  try {
    const res = await client.category.specific.$get({
      query: {
        categoryId: String(categoryId),
      },
    });

    if (res.ok) {
      const category = await res.json();
      $category.set(category);
    }
  } catch (err) {
    // toast erreur
  }
}

export function initCategoryForm({
  categoryId,
  questions,
}: Pick<CategoryResponse, 'categoryId' | 'questions'>): void {
  $categoryForm.setKey('categoryId', categoryId);
  $categoryForm.setKey(
    'answers',
    questions.map((question) => ({
      questionId: question.questionId,
      answer: '',
    }))
  );
}

export function setAnswer(answer: string, index: number): void {
  $categoryForm.setKey(`answers[${index}].answer`, answer);
}

export function setEmail(email: string): void {
  $categoryForm.setKey('email', email);
}
