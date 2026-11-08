<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Plus, RotateCw } from 'lucide-vue-next';
import WeekNav from '@/components/WeekNav.vue';
import ScheduleBlock from '@/components/ScheduleBlock.vue';
import { useScheduleStore } from '@/stores/schedule';
import { useRecipesStore } from '@/stores/recipes';
import { KINDS, dayKey, weekDays } from '@/lib/kitchen';
import { errorMessage } from '@/services/api';
import type { BlockKind, ScheduleBlock as Block } from '@/types/api';

const schedule = useScheduleStore();
const recipes = useRecipesStore();
const { weekStart, weekEnd, byDay, loading, error } = storeToRefs(schedule);

const todayKey = dayKey(new Date());
const fmtDay = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
const fmtLong = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric' });
const fmtRange = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

const days = computed(() =>
  weekDays(weekStart.value).map((d) => ({
    key: dayKey(d),
    weekday: fmtDay.format(d).replace('.', ''),
    long: fmtLong.format(d),
    date: d.getDate(),
    isToday: dayKey(d) === todayKey,
  })),
);
const range = computed(() => `${fmtRange.format(weekStart.value)} – ${fmtRange.format(weekEnd.value)}`);
const isCurrentWeek = computed(() => days.value.some((d) => d.isToday));
const total = computed(() => Object.values(byDay.value).reduce((n, list) => n + list.length, 0));
const doneCount = computed(() => Object.values(byDay.value).reduce((n, list) => n + list.filter((b) => b.done).length, 0));

const recipeName = (block: Block) => (block.recipeId ? recipes.byId.get(block.recipeId)?.name ?? '' : '');

// Formulario para agregar un bloque
const form = reactive<{ date: string; start: string; end: string; kind: BlockKind; title: string; recipeId: string }>({
  date: todayKey, start: '08:00', end: '09:00', kind: 'trabajo', title: '', recipeId: '',
});
const saving = ref(false);
const formError = ref('');
const actionError = ref('');

// Al cambiar de semana, el día del formulario pasa a esa semana (hoy si es la actual)
watch(days, (list) => {
  const fallback = list.find((d) => d.isToday) ?? list[0];
  if (fallback && !list.some((d) => d.key === form.date)) form.date = fallback.key;
}, { immediate: true });
watch(() => form.kind, (kind) => { if (kind !== 'comida') form.recipeId = ''; });

async function submit() {
  formError.value = '';
  saving.value = true;
  try {
    await schedule.create({
      date: form.date,
      start: form.start,
      end: form.end,
      kind: form.kind,
      title: form.title,
      recipeId: form.kind === 'comida' && form.recipeId ? form.recipeId : null,
    });
    form.title = '';
  } catch (e) {
    formError.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}

async function toggle(block: Block) {
  actionError.value = '';
  try {
    await schedule.toggleDone(block);
  } catch (e) {
    actionError.value = `No se pudo actualizar "${block.title}": ${errorMessage(e)}`;
  }
}

async function remove(block: Block) {
  actionError.value = '';
  try {
    await schedule.remove(block.id);
  } catch (e) {
    actionError.value = `No se pudo quitar "${block.title}": ${errorMessage(e)}`;
  }
}

onMounted(() => {
  schedule.loadWeek();
  recipes.fetchAll();
});
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="page-head">
        <h1>Plan semanal</h1>
        <p class="num">Semana del {{ range }} · {{ doneCount }} de {{ total }} {{ total === 1 ? 'actividad realizada' : 'actividades realizadas' }}</p>
      </div>
      <WeekNav
        :is-current="isCurrentWeek"
        @prev="schedule.shiftWeek(-1)"
        @next="schedule.shiftWeek(1)"
        @current="schedule.loadWeek(new Date())"
      />
    </header>

    <form class="add panel" @submit.prevent="submit">
      <h2>Agregar a la semana</h2>
      <div class="add-fields">
        <label class="field">
          <span class="field-label">Día</span>
          <select v-model="form.date" class="select day-select">
            <option v-for="d in days" :key="d.key" :value="d.key">{{ d.long }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Tipo</span>
          <select v-model="form.kind" class="select">
            <option v-for="k in KINDS" :key="k.id" :value="k.id">{{ k.label }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Inicio</span>
          <input v-model="form.start" class="input num" type="time" required />
        </label>
        <label class="field">
          <span class="field-label">Fin</span>
          <input v-model="form.end" class="input num" type="time" required />
        </label>
        <label class="field title-field">
          <span class="field-label">Título</span>
          <input v-model="form.title" class="input" maxlength="80" :placeholder="form.kind === 'gym' ? 'Pierna, cardio…' : form.kind === 'comida' ? 'Almuerzo' : ''" />
        </label>
        <label v-if="form.kind === 'comida'" class="field title-field">
          <span class="field-label">Receta</span>
          <select v-model="form.recipeId" class="select">
            <option value="">Sin receta</option>
            <option v-for="r in recipes.items" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </label>
      </div>
      <div class="add-actions">
        <p v-if="formError" class="notice notice-error" role="alert">{{ formError }}</p>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <Plus :size="18" aria-hidden="true" /> {{ saving ? 'Agregando…' : 'Agregar' }}
        </button>
      </div>
    </form>

    <p v-if="actionError" class="notice notice-error" role="alert">{{ actionError }}</p>

    <div v-if="error" class="notice notice-error state">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-quiet" @click="schedule.loadWeek()">
        <RotateCw :size="17" aria-hidden="true" /> Reintentar
      </button>
    </div>

    <ol v-else class="week" :aria-busy="loading">
      <li v-for="day in days" :key="day.key" class="day" :class="{ today: day.isToday }">
        <h2 class="day-head">
          <span class="day-name">{{ day.weekday }}</span>
          <span class="day-num num">{{ day.date }}</span>
          <span v-if="day.isToday" class="visually-hidden">(hoy)</span>
        </h2>
        <div class="day-blocks">
          <ScheduleBlock
            v-for="block in byDay[day.key] ?? []"
            :key="block.id"
            :block="block"
            :recipe-name="recipeName(block)"
            compact
            removable
            checkable
            @remove="remove"
            @toggle="toggle"
          />
          <p v-if="!loading && !(byDay[day.key]?.length)" class="free">Libre</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }

.add { padding: 1.25rem 1.5rem; display: grid; gap: 1rem; }
.add h2 { font-size: 1.15rem; }
.add-fields { display: grid; grid-template-columns: 1.4fr 1fr 0.8fr 0.8fr 2fr; gap: 0.75rem; }
.add-fields:has(> :nth-child(6)) { grid-template-columns: 1.4fr 1fr 0.8fr 0.8fr 1.4fr 1.4fr; }
.day-select { text-transform: capitalize; }
.add-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 1rem; }
.add-actions .btn:disabled { opacity: 0.6; }

.state { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }

.week {
  margin: 0; padding: 0; list-style: none;
  display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.5rem;
  transition: opacity 160ms var(--ease-out);
}
.week[aria-busy='true'] { opacity: 0.6; }

.day {
  display: grid; align-content: start; gap: 0.5rem;
  min-height: 220px; padding: 0.5rem;
  border-radius: var(--radius-l);
  background: var(--enamel-raised);
  border: 1px solid var(--line);
}
.day.today { background: var(--mint); border-color: var(--mint-deep); }

.day-head { display: grid; justify-items: center; padding: 0.35rem 0 0.25rem; text-transform: capitalize; }
.day-name { font: 600 0.8rem var(--font-ui); color: var(--ink-faint); }
.today .day-name { color: var(--mint-ink); }
.day-num { font-size: 1.3rem; }

.day-blocks { display: grid; gap: 0.4rem; }
.free { text-align: center; font-size: 0.82rem; color: var(--ink-faint); padding: 1rem 0; }

@media (max-width: 1100px) {
  .add-fields, .add-fields:has(> :nth-child(6)) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .title-field { grid-column: 1 / -1; }
}

@media (max-width: 1024px) and (min-width: 861px) {
  .week { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 860px) {
  .add { padding: 1.1rem; }
  .add-actions .btn { width: 100%; }
  .week { grid-template-columns: 1fr; }
  .day { min-height: 0; padding: 0.75rem; }
  .day-head { display: flex; align-items: baseline; gap: 0.4rem; justify-items: start; padding: 0 0 0.25rem; }
  .day-num { font-size: 1.1rem; }
  .free { text-align: left; padding: 0; }
}
</style>
