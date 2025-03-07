<template>
  <article
    class="VerseCard border-1 p-5"
    :class="{ 'border-green-400': selected }"
  >
    <section>
      <p
        v-for="part of splittedText"
        :key="part"
      >
        {{ part }}
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  selected: {
    type: Boolean,
    required: true,
  },
});

const splittedText = computed(() => {
  return props.content.split('\n');
});
</script>

<style scoped>

</style>
