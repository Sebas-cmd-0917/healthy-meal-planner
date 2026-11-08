<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Check } from 'lucide-vue-next';
import FridgeDoor from '@/components/FridgeDoor.vue';
import ScheduleBlock from '@/components/ScheduleBlock.vue';
import { useRecipesStore } from '@/stores/recipes';
import { useScheduleStore } from '@/stores/schedule';
import { useTasksStore } from '@/stores/tasks';

const recipes = useRecipesStore();
const schedule = useScheduleStore();
const tasks = useTasksStore();
const { today, todayError } = storeToRefs(schedule);
const { today: todayTasks } = storeToRefs(tasks);

const actionError = ref('');
const run = async (fn) => {
  actionError.value = '';
  try {
    await fn();
  } catch (e) {
    actionError.value = e.message;
  }
};

const dateLabel = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const title = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

const recipeName = (block) => (block.recipeId ? recipes.byId.get(block.recipeId)?.name ?? '' : '');

// Re-render cada minuto para que el "Ahora" avance solo
const tick = ref(0);
let timer;
onMounted(() => {
  schedule.loadToday();
  tasks.loadToday();
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
          <p class="num">{{ today.filter((b) => b.done).length }} de {{ today.length }} realizadas</p>
        </header>

        <p v-if="todayError" class="notice notice-error">{{ todayError }}</p>
        <p v-else-if="!today.length" class="empty">
          No hay nada planeado para hoy. <RouterLink to="/plan">Armar la semana</RouterLink>
        </p>
        <ol v-else class="timeline" :data-tick="tick">
          <li v-for="block in today" :key="block.id">
            <ScheduleBlock :block="block" :recipe-name="recipeName(block)" checkable @toggle="run(() => schedule.toggleDone(block))" />
          </li>
        </ol>

        <p v-if="actionError" class="notice notice-error" role="alert">{{ actionError }}</p>

        <section v-if="todayTasks.length" class="tasks" aria-labelledby="tasks-title">
          <h3 id="tasks-title">Tareas de hoy</h3>
          <ul>
            <li v-for="t in todayTasks" :key="t.id" :class="{ done: t.done }">
              <button
                type="button"
                class="check"
                :aria-pressed="t.done"
                :aria-label="`${t.done ? 'Marcar como no hecha' : 'Marcar como hecha'}: ${t.title}`"
                @click="run(() => tasks.toggle(t))"
              >
                <Check v-if="t.done" :size="14" :stroke-width="3" aria-hidden="true" />
              </button>
              <span>{{ t.title }}</span>
            </li>
          </ul>
        </section>
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

.tasks { display: grid; gap: 0.4rem; padding-top: 1rem; border-top: 1px solid var(--line); }
.tasks h3 { font-size: 1.05rem; }
.tasks ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.2rem; }
.tasks li { display: flex; align-items: center; gap: 0.65rem; min-height: 40px; }
.tasks li.done span { text-decoration: line-through; color: var(--ink-faint); }
.check {
  position: relative; display: grid; place-items: center; flex: none;
  width: 22px; height: 22px; padding: 0;
  border: 2px solid var(--herb); border-radius: 7px;
  background: var(--enamel-raised); color: #fff; cursor: pointer;
  transition: background-color 140ms var(--ease-out), transform 140ms var(--ease-out);
}
.check::after { content: ''; position: absolute; inset: -11px; }
.check:active { transform: scale(0.9); }
.check[aria-pressed='true'] { background: var(--herb); }

@media (max-width: 1024px) {
  .today { grid-template-columns: 1fr; }
}
@media (max-width: 860px) {
  /* En el celular la nevera va primero: es la acción del momento */
  .today > :last-child { order: -1; }
}
</style>
