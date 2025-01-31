import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: import('@/views/HomeView.vue'),
    },
    {
      path: '/music',
      name: 'music-root',
      redirect: {
        name: 'music-all',
      },
      children: [
        {
          path: '/',
          name: 'music-all',
          component: import('@/views/Music/AllCategories.vue'),
        },
        {
          path: '/:categoryId',
          name: 'music-category',
          component: import('@/views/Music/OneCategory.vue'),
        },
      ],
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
    },
  ],
})

export default router
