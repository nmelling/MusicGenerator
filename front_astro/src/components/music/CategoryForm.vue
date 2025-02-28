<template>
  <form
    class="flex flex-col"
  >
    <label class="flex flex-col py-5">
      <span>Adresse email</span>
      <input
        type="email"
        required
        placeholder="adresse@mail.com"
        :value="form.email"
        @input="(e) => setEmail((e.target as HTMLInputElement).value)"
      />
    </label>
    <label
      v-for="(question, index) in questions"
      :key="question.questionId"
      class="flex flex-col py-5"
    >
      <span>{{ question.question }}</span>
      <input
        type="text"
        :placeholder="question.placeholder"
        :required="question.isRequired"
        @input="(e) => setAnswer((e.target as HTMLInputElement).value, index)"
        :value="form.answers[index]?.answer"
      />
    </label>
  </form>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStore } from '@nanostores/vue'
import type { CategoryResponse } from '@/stores/music'
import { $categoryForm, initCategoryForm, setAnswer, setEmail } from '@/stores/music'

const props = defineProps<{
  questions: CategoryResponse["questions"][number][],
  categoryId: number
}>()

onMounted(() => {
  initCategoryForm({ categoryId: props.categoryId, questions: props.questions })
})

const form = useStore($categoryForm)

</script>

<style>

</style>
