import { hc, type InferResponseType } from 'hono/client'
import { computed } from 'nanostores'
import { shared } from '@it-astro:request-nanostores';
import { $categoryForm, $category } from '@/stores/music'

import type { OrderRoutes } from '@/../../back/src/modules/order/order'
import type { NewOrderPayload } from '@/../../back/src/modules/order/validation'

export const client = hc<OrderRoutes>('http://localhost:3000/api/order')
export type NewOrderResponse = InferResponseType<
typeof client.index.$post
>

const newOrderForm = computed([$categoryForm, $category], (form, category): NewOrderPayload | null => {
  if (!form.categoryId || !form.email || !category) return null
  return {
    categoryId: form.categoryId,
    email: form.email,
    answers: form.answers.filter((answer) => {
      return category.questions
      .filter((question) => question.isRequired)
      .map((question) => question.questionId).includes(answer.questionId) ||
      Boolean(answer.answer)
    }),
  }
})

export async function onSubmitNewOrder() {
  console.log(newOrderForm.get())
  const form = newOrderForm.get()
  if (!form) {
    // message d'erreur (toast)
    return
  }

  try {
    const res = await client.index.$post({
      json: form,
    })

    if (res.ok) {
      // set de la commande + redirection sur page dédiée
    }
  } catch (err) {
    console.log(err)
  }
}
