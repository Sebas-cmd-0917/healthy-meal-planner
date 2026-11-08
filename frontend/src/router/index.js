import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'today', component: HomeView, meta: { title: 'Hoy' } },
    { path: '/plan', name: 'plan', component: () => import('@/views/PlanView.vue'), meta: { title: 'Plan semanal' } },
    { path: '/gym', name: 'gym', component: () => import('@/views/GymView.vue'), meta: { title: 'Gym' } },
    { path: '/tareas', name: 'tasks', component: () => import('@/views/TasksView.vue'), meta: { title: 'Tareas' } },
    { path: '/gastos', name: 'expenses', component: () => import('@/views/ExpensesView.vue'), meta: { title: 'Gastos' } },
    { path: '/recetas', name: 'recipes', component: () => import('@/views/RecipesView.vue'), meta: { title: 'Recetas' } },
  ],
});
