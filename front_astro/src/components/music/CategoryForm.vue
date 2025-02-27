<template>
  <form>
    <label
      v-for="question of questions"
      :key="question.questionId"
    >
      <span>{{ question.question }}</span>
      <input
        type="text"
        :placeholder="question.placeholder"

      />
    </label>
  </form>
</template>

<script setup lang="ts">
import { ref, type Ref, onMounted } from 'vue'
import type { CategoryResponse } from '@/stores/music'

const props = defineProps<{
  questions: CategoryResponse["questions"][number][],
  categoryId: number
}>()

onMounted(() => {

})

</script>

<style>

</style>
