<template>
  <section class="Lyric">
    {{ lyric}}
  </section>
</template>

<script setup lang="ts">
import type { OrderResponse } from '@/stores/order';

const props = defineProps<{
  lyric: OrderResponse['lyrics'][number];
}>();
</script>

<style lang="stylus">

</style>
