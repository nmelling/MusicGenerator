<template>
  <article class="Lyric">
    <header>
      <div class="flex content-center">
        <input
          ifd="editLyricCheckbox"
          v-model="editLyric"
          type="checkbox"
        />
        <label for="editLyricCheckbox">Je souhaite modifier une partie des paroles</label>
      </div>
    </header>
    <section>
      <div v-if="editLyric">Sélectionnez les parties à modifier :</div>
      <div
        class="mb-2"
        v-for="(verse, index) in displayedVerses"
        :key="`${verse.categorizer}-${index}`"
        @click="() => onSelectVerse(verse.categorizer)"
      >
        <VerseCard
          :content="verse.text"
          :selected="selectedVerses.includes(verse.categorizer)"
        />
      </div>
      <button
        v-if="editLyric"
        :title="!selectedVerses.length ? `Aucune partie de la chanson n'est sélectionnée` : ''"
        :disabled="!selectedVerses.length"
        @click="$emit('edited', { lyrics: lyric.lyricsId, selectedParts: selectedVerses })"
      >Modifier</button>
    </section>
    <section>
      <button
        @click="$emit('edited', { lyricsId: lyric.lyricsId })"
      >Je modifie la totalité des paroles</button>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref, type Ref, computed, watch } from 'vue';
import type { OrderResponse } from '@/stores/order';
import VerseCard from './VerseCard.vue';

// todo si déprécié, afficher un style particulier + bouton pour sélectionner ce lyric
const props = defineProps<{
  lyric: OrderResponse['lyrics'][number];
}>();

const displayedVerses = computed(() => {
  if (!props.lyric.layout.length) return [];

  type Formatted = {
    categorizer: string;
    text: string;
  };

  const formatted = props.lyric.layout
    .map((categorizer): Formatted => {
      const lowered = categorizer.toLowerCase();
      const formatted: Formatted = {
        categorizer,
        text: '',
      };

      if (lowered.includes('chorus')) {
        formatted.text = props.lyric.refrain.text;
        return formatted;
      }

      const verse = props.lyric.verses
        .filter((verse) => !verse.deprecated)
        .find((verse) => verse.text.toLowerCase().startsWith(lowered));
      if (!verse) return formatted;
      formatted.text = verse.text;
      return formatted;
    })
    .filter((item) => Boolean(item.text));

  return formatted;
});

const editLyric = ref(false);
const selectedVerses: Ref<string[]> = ref([]);

function onSelectVerse(categorizer: string) {
  if (!editLyric.value) return;
  if (selectedVerses.value.includes(categorizer)) {
    selectedVerses.value = selectedVerses.value.filter((item) => item !== categorizer);
    return;
  }
  selectedVerses.value.push(categorizer);
}

watch(
  () => editLyric.value,
  (newVal) => {
    if (!newVal) selectedVerses.value = [];
  },
);
</script>

<style lang="stylus">

</style>
