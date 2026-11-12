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
      path: '/prd-studio',
      name: 'prd-studio',
      component: () => import('@/views/PrdStudioView.vue'),
    },
    {
      path: '/ops',
      name: 'production-ops',
      component: () => import('@/views/ProductionOpsView.vue'),
    },
    {
      path: '/prompt-engineer',
      name: 'prompt-engineer',
      component: () => import('@/views/PromptEngineerView.vue'),
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideView.vue'),
    },
    {
      path: '/dev-vault',
      name: 'dev-vault',
      component: () => import('@/views/DevVaultView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
