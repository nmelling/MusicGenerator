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
          <form @submit.prevent="onSubmit">
            <fieldset v-for="item of questions" :key="item.questionId" class="fieldset">
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
import { ref, onMounted, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { type InferResponseType } from 'hono/client'
import { musicClient } from '@/lib/api'

// V1 poc -- need correct validation/patch

const route = useRoute()

type PartialCategoryResponse = InferResponseType<typeof musicClient.category.specific.$get>

const category: Ref<PartialCategoryResponse | null> = ref(null)
const questions = ref<(PartialCategoryResponse['questions'][number] & { answer: string })[]>([])
const loading = ref(false)

async function fetchCategory () {
  loading.value = true
  let categoryId = ''
  if (typeof route.params.categoryId === 'string') categoryId = route.params.categoryId
  if (!categoryId) return

  try {
    const res = await musicClient.category.specific.$get({
      query: {
        categoryId,
      },
    })
    if (res.ok) {
      category.value = await res.json()
    }
  } catch (error) {
    // todo toast
    console.error(error)
  }
  loading.value = false
}

function setQuestions () {
  if (!category.value) return []
  questions.value = category.value.questions.map((item) => ({
    ...item,
    answer: '',
  }))
}

onMounted(async () => {
  await fetchCategory()
  setQuestions()
})

async function onSubmit(): Promise<void> {
  console.log({ questions: questions.value })
}
</script>

<style></style>
