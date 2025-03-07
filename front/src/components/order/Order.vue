<template>
  <article>
    <header>
      <div>N° Commande: {{ order.orderId }}</div>
      <div>Date de la commande: {{ order.created_at }}</div>
      <div>
        <span v-if="order.validated_at">Date de validation de la commande: {{ order.validated_at }}</span>
        <span v-else>Commande non validée</span>
      </div>
      <div>Modifications restantes: {{ 3 - order.modificationCounter }}</div>
    </header>
    <section>
      <h3>Paroles</h3>
      <section>
        <Lyric
          class="my-10"
          v-for="lyric of order.lyrics"
          :key="lyric.lyricsId"
          :lyric="JSON.parse(JSON.stringify(lyric))"
          @edited="onChangeLyrics"
        />
      </section>
    </section>
    TODO: Inner Loading quand moddification lyric OU génération de la chanson
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { $order, fetchOrder, modifyLyrics } from '@/stores/order';
import { useStore } from '@nanostores/vue';
import Lyric from '@/components/lyric/Lyric.vue';

const props = defineProps({
  orderId: {
    type: String,
    required: true,
  },
});

const order = useStore($order);

if (import.meta.env.SSR) {
  await fetchOrder(props.orderId);
}

const loading = ref(false);
async function onChangeLyrics({ lyricsId, selectedParts }: { lyricsId: string; selectedParts?: string[] }) {
  if (loading.value) return;
  loading.value = true;
  await modifyLyrics(props.orderId, lyricsId, selectedParts);
  loading.value = false;
}
</script>

<style>

</style>
