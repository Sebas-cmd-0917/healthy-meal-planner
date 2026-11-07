import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'today', component: HomeView, meta: { title: 'Hoy' } },
    { path: '/plan', name: 'plan', component: () => import('@/views/PlanView.vue'), meta: { title: 'Plan semanal' } },
    { path: '/recetas', name: 'recipes', component: () => import('@/views/RecipesView.vue'), meta: { title: 'Recetas' } },
  ],
});
