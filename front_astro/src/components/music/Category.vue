<template>
  <article>
    <header>
      <h3>{{ category.name }}</h3>
    </header>
    <section>
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
          v-for="(question, index) in category.questions"
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
    </section>
    <section>
      <button @click="onSubmit" >Valider</button>
    </section>
  </article>
</template>

<script setup lang="ts">


import { fetchCategory, initCategoryForm, $category, $categoryForm, setAnswer, setEmail } from '@/stores/music'
import { useStore } from '@nanostores/vue'

const props = defineProps({
  categoryId: {
    type: Number,
    required: true,
  },
})

const category = useStore($category)
const form = useStore($categoryForm)

if (import.meta.env.SSR) {
  await fetchCategory(props.categoryId)
  initCategoryForm({ categoryId: category.value.categoryId, questions: [...category.value.questions] })
}

async function onSubmit () {
  console.log(form.value)
  // todo validation checking (required questions)
}

</script>

<style>

</style>
