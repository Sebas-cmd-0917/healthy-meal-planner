<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import FridgeDoor from '@/components/FridgeDoor.vue';
import ScheduleBlock from '@/components/ScheduleBlock.vue';
import { useRecipesStore } from '@/stores/recipes';
import { useScheduleStore } from '@/stores/schedule';

const recipes = useRecipesStore();
const schedule = useScheduleStore();
const { today, todayError } = storeToRefs(schedule);

const dateLabel = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const title = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

const recipeName = (block) => (block.recipeId ? recipes.byId.get(block.recipeId)?.name ?? '' : '');

// Re-render cada minuto para que el "Ahora" avance solo
const tick = ref(0);
let timer;
onMounted(() => {
  schedule.loadToday();
  recipes.fetchAll();
  timer = setInterval(() => { tick.value += 1; }, 60_000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>{{ title }}</h1>
      <p>Tu día y lo que tienes en casa.</p>
    </header>

    <div class="today">
      <section class="day panel" aria-labelledby="day-title">
        <header class="day-head">
          <h2 id="day-title">Tu día</h2>
          <p class="num">{{ today.length }} {{ today.length === 1 ? 'actividad' : 'actividades' }}</p>
        </header>

        <p v-if="todayError" class="notice notice-error">{{ todayError }}</p>
        <p v-else-if="!today.length" class="empty">
          No hay nada planeado para hoy. <RouterLink to="/plan">Armar la semana</RouterLink>
        </p>
        <ol v-else class="timeline" :data-tick="tick">
          <li v-for="block in today" :key="block.id">
            <ScheduleBlock :block="block" :recipe-name="recipeName(block)" />
          </li>
        </ol>
      </section>

      <FridgeDoor />
    </div>
  </div>
</template>

<style scoped>
.today {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.day { padding: 1.5rem; display: grid; gap: 1rem; }
.day-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.day-head h2 { font-size: 1.35rem; }
.day-head p { font-size: 0.88rem; color: var(--ink-faint); }

.timeline { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.6rem; }
.empty { color: var(--ink-soft); }

@media (max-width: 1024px) {
  .today { grid-template-columns: 1fr; }
}
@media (max-width: 860px) {
  /* En el celular la nevera va primero: es la acción del momento */
  .today > :last-child { order: -1; }
}
</style>
