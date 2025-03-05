<template>
  <article class="Lyric">
    <header></header>
    <section>
      <div>Sélectionnez les versets à modifier :</div>
      <div
        v-for="(verse, index) in displayedVerses"
        :key="index"
      >
        <div></div>
        <!-- TODO Sanitized html interpretation -->
        <pre>{{ verse.text }}</pre>
      </div>

    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OrderResponse } from '@/stores/order';

// todo si déprécié, afficher un style particulier + bouton pour sélectionner ce lyric
const props = defineProps<{
  lyric: OrderResponse['lyrics'][number];
}>();

const displayedVerses = computed(() => {
  if (!props.lyric.layout.length) return [];
  const formatted = props.lyric.layout
    .map((str) => {
      const lowered = str.toLowerCase();
      if (lowered.includes('chorus')) return props.lyric.refrain;

      const verse = props.lyric.verses.filter((verse) => !verse.deprecated).find((verse) => verse.text.startsWith(str));
      if (!verse) return null;
      return verse;
    })
    .filter((item) => item !== null);

  return formatted;
});
</script>

<style lang="stylus">

</style>
