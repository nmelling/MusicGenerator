<template>
  <section
    class="flex"
  >
    <article
      v-for="category of availableCategories"
      :key="category.name"
      class="px-5"
    >
      <a :href="`/music/${category.categoryId}`">
        <header>{{ category.name }}</header>
        <section>
          <p>{{ category.description }}</p>
        </section>
      </a>
    </article>
  </section>
</template>

<script setup lang="ts">
import { fetchAvailableCategories, $availableCategories } from '@/stores/music';
import { useStore } from '@nanostores/vue';

// todo: pagination

if (import.meta.env.SSR) await fetchAvailableCategories();
const availableCategories = useStore($availableCategories);
</script>

<style>

</style>
