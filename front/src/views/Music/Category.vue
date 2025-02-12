<template>
  <section class="Category">
    <span v-if="loading" class="loading loading-spinner loading-lg"></span>
    <article v-else>
      <template v-if="category">
        <header>
          <h2 class="text-2xl">{{ category.name }}</h2>
          <p>{{ category.description }}</p>
        </header>
        <section>
          <form
            @submit.prevent="onSubmit"
          >
          <fieldset
            v-for="item of questions"
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
            <button class="btn btn-primary mt-5" type="submit">Continuez</button>
          </form>
        </section>
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

type Question = MusicQuestion & { answer: string }

const category = ref(null)
const questions = ref<Question[]>([])
const loading = ref(false)

function setQuestions () {
  if (!category.value) return []

  return R.pipe(
    category.value.questions,
    R.sortBy([R.prop('position'), 'asc']),
    R.map(({ question }) => question),
    R.map((question: MusicQuestion) => {
      const copy = JSON.parse(JSON.stringify(question))
      return { ...copy, answer: '' }
    }),
    R.filter(Boolean),
  )
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
    questions.value = setQuestions()
  } catch (error) {
    console.error(error)
  }
  loading.value = false
})



async function onSubmit(): Promise<void> {
  console.log({ questions: questions.value })
}
</script>

<style>

</style>
