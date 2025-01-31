<template>
  <main>Créez votre chanson</main>
</template>

<script setup lang="ts">
import type { AppType } from '../../../../back/src/index'
import { hc } from 'hono/client'

const client = hc<AppType>('/music')
const res = await client.category .$get<AllCategories>()
</script>

<style scoped>

</style>
