<template>
  Toutes les catégories
{{ availableCategories }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { hc } from 'hono/client'
import type { AppType } from '../../../../shared/types/api'

const client = hc<AppType>('http://localhost:3000/api/music')

const availableCategories = ref([])

onMounted(async () => {
  const res = await client.category.$get()
  if (res.ok) {
    availableCategories.value = await res.json()
  }
})
</script>

