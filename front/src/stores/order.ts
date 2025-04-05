import { hc, type InferResponseType, type InferRequestType } from 'hono/client';
import { computed, deepMap } from 'nanostores';
import { shared } from '@it-astro:request-nanostores';
import { $categoryForm, $category } from '@/stores/music';

import type { OrderRoutes } from '@/../../back/src/modules/order/order';

export const client = hc<OrderRoutes>('http://localhost:3000/api/order');
export type NewOrderPayload = InferRequestType<typeof client.new.$post>['json'];

const newOrderForm = computed(
  [$categoryForm, $category],
  (form, category): NewOrderPayload | null => {
    if (!form.categoryId || !form.email || !form.answers || !category)
      return null;
    return {
      categoryId: form.categoryId,
      email: form.email,
      answers: form.answers.filter((answer) => {
        return (
          category.questions
            .filter((question) => question.isRequired)
            .map((question) => question.questionId)
            .includes(answer.questionId) || Boolean(answer.answer)
        );
      }),
    };
  }
);

export async function onSubmitNewOrder(): Promise<{
  success: boolean;
  orderId?: string;
}> {
  const form = newOrderForm.get();
  if (!form) {
    // message d'erreur (toast)
    return { success: false };
  }

  let orderId = '';
  try {
    const res = await client.new.$post({
      json: form,
    });

    if (res.ok) {
      const { orderId: $orderId } = await res.json();
      orderId = $orderId;
    }
  } catch (err) {
    console.log(err);
    return { success: false };
  }
  return { success: true, orderId };
}

export type OrderResponse = InferResponseType<typeof client.one.$get>;
export const $order = shared('$order', deepMap<OrderResponse>());

export async function fetchOrder(orderId: string) {
  try {
    const res = await client.one.$get({
      query: {
        orderId,
      },
    });
    if (res.ok) {
      const order = await res.json();
      $order.set(order);
    }
  } catch (err) {
    // toast erreur
  }
}

export async function modifyLyrics(
  orderId: string,
  lyricsId: string,
  selectedParts: string[] | undefined
) {
  try {
    const res = await client[':orderId'].lyrics.$patch({
      param: {
        orderId,
      },
      json: {
        lyricsId,
        selectedParts,
      },
    });
  } catch (error) {}

  // try {
  //   const res = await client.one.$get({
  //     query: {
  //       orderId,
  //     },
  //   });
  //   if (res.ok) {
  //     const order = await res.json();
  //     $order.set(order);
  //   }
  // } catch (err) {
  //   // toast erreur
  // }
}
