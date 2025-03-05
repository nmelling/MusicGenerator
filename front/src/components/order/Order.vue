<template>
  <article>
    <header>
      <div>N° Commande: {{ order.orderId }}</div>
      <div>Date de la commande: {{ order.created_at }}</div>
      <div>
        <span v-if="order.validated_at">Date de validation de la commande: {{ order.validated_at }}</span>
        <span v-else>Commande non validée</span>
      </div>
    </header>
    <section>
      <h3>Paroles</h3>
      <section>
        <Lyric
          class="my-10"
          v-for="lyric of order.lyrics"
          :key="lyric.lyricsId"
          :lyric="JSON.parse(JSON.stringify(lyric))"
        />
      </section>
    </section>
    Order
  </article>
</template>

<script setup lang="ts">
import { $order, fetchOrder } from '@/stores/order';
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
</script>

<style>

</style>
