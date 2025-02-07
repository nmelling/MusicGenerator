<template>
  <section class="Category">
    <span v-if="loading" class="loading loading-spinner loading-lg"></span>
    <article v-else>
      <template v-if="category">
        <header>
          <h2 class="text-2xl">{{ category.name }}</h2>
          <p>{{ category.description }}</p>
        </header>
        <content>
          <form
            @submit.prevent="onSubmit"
          >
            <fieldset
              v-for="form of forms"
              :key="form.formId"
            >
              <fieldset
                v-for="item of form.questions"
                :key="item.questionId"
                class="fieldset"
              >
                <legend class="fieldset-legend">{{ item.question }}</legend>
                <input
                  v-model="item.answer"
                  class="input"
                  type="text"
                  :placeholder="item.placeholder"
                />
                <p v-if="!item.isRequired" class="fieldset-label">Optional</p>
              </fieldset>
            </fieldset>
            <button class="btn btn-primary mt-5" type="submit">Continuez</button>
          </form>
        </content>
      </template>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as R from 'remeda'
import { hc } from 'hono/client'
import type { MusicRoutes } from '../../../../shared/types/api'
import type { MusicQuestion } from '../../../../shared/types/music'

// V1 poc -- need correct validation/patch

const route = useRoute()

const client = hc<MusicRoutes>('http://localhost:3000/api/music')

type Form = { formId: number, questions: Question[] }
type Question = MusicQuestion & { answer: string }

const category = ref(null)
const forms = ref<Form[]>([])
const loading = ref(false)

function setForm () {
  if (!category.value) return []

  const orderedForms = R.pipe(
    category.value.forms,
    R.sortBy([R.prop('position'), 'asc']),
    R.map(({ form }) => form),
    R.filter(Boolean),
    R.map((form): Form => {
      const orderedQuestions = R.pipe(
        form.questions,
        R.sortBy([R.prop('position'), 'asc']),
        R.map(({ question }) => question),
        R.map((question: MusicQuestion) => {
          const copy = JSON.parse(JSON.stringify(question))
          return { ...copy, answer: '' }
        }),
        R.filter(Boolean),
      )

      return {
        formId: form.formId,
        questions: orderedQuestions
      }
    })
  )

  return orderedForms
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await client.category[':categoryId'].$get({
      param: {
        categoryId: route.params.categoryId
      }
    })
    if (res.ok) {
      category.value = await res.json()
    }
    forms.value = setForm()
  } catch (error) {
    console.error(error)
  }
  loading.value = false
})



async function onSubmit(): Promise<void> {
  console.log({ questions: forms.value })

}
</script>

<style>

</style>
