<template>
  <header
    id="PublicHeader"
    class="flex justify-between py-20 px-10"
  >
    <img :src="Logo.src"/>
    <nav>
      <ul class="flex">
        <li
          v-for="nav of navs"
          :key="navId"
          class="px-5"
        >
          <a :href="nav.to">{{  nav.label  }}</a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import Logo from '../assets/astro.svg'

const navs = ref([
  { navId: 'home', label: 'Accueil', to: '/' },
  { navId: 'musics', label: 'Créez votre chanson', to: '/music/categories' },
  { navId: 'contact', label: 'Contact', to: '/contact' },
])
</script>

<style>

</style>
