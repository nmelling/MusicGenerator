<template>
  <RouterLink
    v-for="category of availableCategories"
    :key="category.categoryId"
    :to="{ name: 'music-category', params: { categoryId: category.categoryId} }"
  >
    {{ category.name }}
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, onMounted } from 'vue'
import { hc } from 'hono/client'
import type { MusicRoutes } from '../../../../shared/types/api'

const client = hc<MusicRoutes>('http://localhost:3000/api/music')

const availableCategories = ref([])

onMounted(async () => {
  const res = await client.category.$get()
  if (res.ok) {
    availableCategories.value = await res.json()
  }
})
</script>

