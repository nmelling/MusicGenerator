<template>
  <section class="AvailableCategories flex flex-wrap justify-evenly">
    <article
      v-for="category of availableCategories"
      class="card bg-base-100 w-90 shadow-sm my-8 hover:cursor-pointer hover:opacity-80"
      @click="router.push({ name: 'music-category', params: { categoryId: category.categoryId } })"
    >
      <figure class="px-10 pt-10">
        <img
          src="@/assets/logo.svg"
          width="100px"
          alt="Shoes"
          class="rounded-xl"
        />
      </figure>
      <content class="card-body items-center text-center">
        <h2 class="card-title">{{ category.name }}</h2>
        <!-- <p class="overflow-hidden text-ellipsis m-w-96">{{ category.description }}</p> -->
        <div class="card-actions justify-end">
        </div>
      </content>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { hc } from 'hono/client'
import type { MusicRoutes } from '../../../../shared/types/api'

const router = useRouter()

const client = hc<MusicRoutes>('http://localhost:3000/api/music')

const availableCategories = ref([])

onMounted(async () => {
  const res = await client.category.$get()
  if (res.ok) {
    availableCategories.value = await res.json()
  }
})
</script>

