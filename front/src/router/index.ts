import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/music',
      name: 'music-root',
      redirect: { name: 'music-all-categories'},
      children: [
        {
          path: '',
          name: 'music-all-categories',
          component: () => import('@/views/Music/AvailableCategories.vue'),
        },
        {
          path: ':categoryId',
          name: 'music-category',
          component: () => import('@/views/Music/Category.vue'),
        },
      ],
    },
  ],
})

export default router
