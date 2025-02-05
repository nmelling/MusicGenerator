<template>
  Catégorie:
  {{ category }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { hc } from 'hono/client'
import type { MusicRoutes } from '../../../../shared/types/api'

const client = hc<MusicRoutes>('http://localhost:3000/api/music')

const category = ref({})

onMounted(async () => {
  const res = await client.category[':categoryId'].$get({
    param: {
      categoryId: 3
    }
  })
  if (res.ok) {
    category.value = await res.json()
  }
})
</script>

<style>

</style>
