<template>
  <main>
    APP HOME
  </main>
</template>

<script setup lang="ts">
import { hc } from 'hono/client'
import type { MusicRoutes } from '../../../shared/types/music';

const client = hc<MusicRoutes>('http://localhost:3000/music')
const categories = await client.category.$get()

</script>

