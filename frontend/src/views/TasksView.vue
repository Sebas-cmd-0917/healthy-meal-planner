<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Check, Plus, RotateCw, X } from 'lucide-vue-next';
import WeekNav from '@/components/WeekNav.vue';
import { useTasksStore } from '@/stores/tasks';
import { dayKey, weekDays } from '@/lib/kitchen';

const tasks = useTasksStore();
const { weekStart, weekEnd, byDay, summary, loading, error } = storeToRefs(tasks);

const todayKey = dayKey(new Date());
const fmtDay = new Intl.DateTimeFormat('es-CO', { weekday: 'long' });
const fmtRange = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

const days = computed(() =>
  weekDays(weekStart.value).map((d) => ({
    key: dayKey(d), weekday: fmtDay.format(d), date: d.getDate(), isToday: dayKey(d) === todayKey,
  })),
);
const range = computed(() => `${fmtRange.format(weekStart.value)} – ${fmtRange.format(weekEnd.value)}`);
const isCurrentWeek = computed(() => days.value.some((d) => d.isToday));

const drafts = reactive({});
const busy = ref(false);
const actionError = ref('');

const run = async (fn) => {
  actionError.value = '';
  try {
    await fn();
  } catch (e) {
    actionError.value = e.message;
  }
};

async function add(day) {
  const title = (drafts[day.key] ?? '').trim();
  if (!title || busy.value) return;
  busy.value = true;
  await run(async () => {
    await tasks.create({ date: day.key, title });
    drafts[day.key] = '';
  });
  busy.value = false;
}

onMounted(() => tasks.loadWeek());
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="page-head">
        <h1>Tareas</h1>
        <p class="num">Semana del {{ range }}</p>
      </div>
      <WeekNav :is-current="isCurrentWeek" @prev="tasks.shiftWeek(-1)" @next="tasks.shiftWeek(1)" @current="tasks.loadWeek(new Date())" />
    </header>

    <section class="progress panel" aria-label="Cumplimiento de la semana">
      <p><strong class="num">{{ summary.done }} de {{ summary.total }}</strong> tareas hechas</p>
      <div class="bar" role="progressbar" :aria-valuenow="summary.percent" aria-valuemin="0" aria-valuemax="100" :aria-label="`${summary.percent}% cumplido`">
        <span :style="{ width: `${summary.percent}%` }"></span>
      </div>
      <p class="num percent">{{ summary.percent }}%</p>
    </section>

    <p v-if="actionError" class="notice notice-error" role="alert">{{ actionError }}</p>

    <div v-if="error" class="notice notice-error state">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-quiet" @click="tasks.loadWeek()"><RotateCw :size="17" aria-hidden="true" /> Reintentar</button>
    </div>

    <ol v-else class="week" :aria-busy="loading">
      <li v-for="day in days" :key="day.key" class="day" :class="{ today: day.isToday }">
        <h2 class="day-head">
          <span class="day-name">{{ day.weekday }}</span>
          <span class="num">{{ day.date }}</span>
          <span v-if="day.isToday" class="today-pill">Hoy</span>
        </h2>

        <ul class="list">
          <li v-for="t in byDay[day.key] ?? []" :key="t.id" class="task" :class="{ done: t.done }">
            <button
              type="button"
              class="check"
              :aria-pressed="t.done"
              :aria-label="`${t.done ? 'Marcar como no hecha' : 'Marcar como hecha'}: ${t.title}`"
              @click="run(() => tasks.toggle(t))"
            >
              <Check v-if="t.done" :size="14" :stroke-width="3" aria-hidden="true" />
            </button>
            <span class="task-title">{{ t.title }}</span>
            <button type="button" class="remove" :aria-label="`Quitar tarea: ${t.title}`" @click="run(() => tasks.remove(t))">
              <X :size="15" aria-hidden="true" />
            </button>
          </li>
        </ul>

        <form class="add" @submit.prevent="add(day)">
          <label class="visually-hidden" :for="`task-${day.key}`">Nueva tarea para el {{ day.weekday }}</label>
          <input :id="`task-${day.key}`" v-model="drafts[day.key]" class="input" placeholder="Nueva tarea" maxlength="120" autocomplete="off" />
          <button type="submit" class="btn btn-quiet add-btn" :aria-label="`Agregar tarea al ${day.weekday}`" :disabled="!(drafts[day.key] ?? '').trim()">
            <Plus :size="17" aria-hidden="true" />
          </button>
        </form>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
.state { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }

.progress { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1.25rem; padding: 1rem 1.5rem; }
.progress strong { font-family: var(--font-display); font-size: 1.15rem; }
.bar { height: 10px; border-radius: 999px; background: var(--mint); overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: inherit; background: var(--herb); transition: width 300ms var(--ease-out); }
.percent { font-weight: 700; color: var(--herb); }

.week { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0.75rem; }
.week[aria-busy='true'] { opacity: 0.6; }
.day {
  display: grid; grid-template-rows: auto 1fr auto; gap: 0.5rem;
  min-height: 200px; padding: 0.9rem;
  border-radius: var(--radius-l); background: var(--enamel-raised); border: 1px solid var(--line);
}
.day.today { background: var(--mint); border-color: var(--mint-deep); }
.day-head { display: flex; align-items: baseline; gap: 0.35rem; font-size: 1rem; text-transform: capitalize; }
.today-pill { margin-left: auto; align-self: center; font: 700 0.7rem var(--font-ui); padding: 0.1rem 0.5rem; border-radius: 999px; background: var(--herb); color: #fff; }

.list { margin: 0; padding: 0; list-style: none; display: grid; align-content: start; gap: 0.15rem; }
.task { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 0.5rem; padding: 0.35rem 0.1rem; }
.task-title { font-size: 0.9rem; line-height: 1.35; padding-top: 0.1rem; overflow-wrap: anywhere; }
.task.done .task-title { text-decoration: line-through; color: var(--ink-faint); }

.check {
  position: relative; display: grid; place-items: center;
  width: 20px; height: 20px; margin-top: 0.05rem; padding: 0;
  border: 2px solid var(--herb); border-radius: 6px;
  background: var(--enamel-raised); color: #fff; cursor: pointer;
  transition: background-color 140ms var(--ease-out), transform 140ms var(--ease-out);
}
.check::after { content: ''; position: absolute; inset: -12px; }
.check:active { transform: scale(0.9); }
.check[aria-pressed='true'] { background: var(--herb); }

.remove {
  display: grid; place-items: center; width: 26px; height: 26px; padding: 0;
  border: 0; border-radius: 7px; background: transparent; color: var(--ink-faint); cursor: pointer; opacity: 0.6;
}
.remove:focus-visible { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .remove { opacity: 0; }
  .task:hover .remove { opacity: 0.7; }
  .remove:hover { opacity: 1; background: var(--enamel); }
}

.add { display: grid; grid-template-columns: 1fr 44px; gap: 0.35rem; }
.add .input { min-height: 44px; font-size: 0.9rem; }
.add-btn { min-height: 44px; padding: 0; }
.add-btn:disabled { opacity: 0.5; }

@media (max-width: 860px) {
  .progress { grid-template-columns: 1fr auto; padding: 1rem; }
  .bar { grid-column: 1 / -1; grid-row: 2; }
  .week { grid-template-columns: 1fr; }
  .day { min-height: 0; padding: 0.9rem; }
}
</style>
