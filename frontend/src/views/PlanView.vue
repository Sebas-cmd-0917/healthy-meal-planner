<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { RotateCw } from 'lucide-vue-next';
import { useRecipesStore } from '@/stores/recipes';
import { usePlanStore } from '@/stores/plan';
import { MEALS, currentWeek, dayKey, mealOfRecipe } from '@/lib/kitchen';

const recipes = useRecipesStore();
const plan = usePlanStore();
const { items, loading, error, loaded } = storeToRefs(recipes);

const week = currentWeek();
const todayKey = dayKey(new Date());
const fmtDay = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
const fmtRange = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

const days = week.map((d) => ({
  key: dayKey(d),
  weekday: fmtDay.format(d).replace('.', ''),
  date: d.getDate(),
  isToday: dayKey(d) === todayKey,
}));
const range = `${fmtRange.format(week[0])} – ${fmtRange.format(week[6])}`;

// Primero las recetas marcadas para esa comida, luego el resto
function optionsFor(mealId) {
  const fits = items.value.filter((r) => mealOfRecipe(r)?.id === mealId);
  const others = items.value.filter((r) => mealOfRecipe(r)?.id !== mealId);
  return { fits, others };
}
const options = computed(() => Object.fromEntries(MEALS.map((m) => [m.id, optionsFor(m.id)])));

onMounted(() => recipes.fetchAll());
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Plan semanal</h1>
      <p class="num">Semana del {{ range }}</p>
    </header>

    <p v-if="loading && !loaded" class="notice">Cargando recetas…</p>

    <div v-else-if="error" class="notice notice-error state">
      <p>{{ error }} Sin recetas no se puede armar el plan.</p>
      <button type="button" class="btn btn-quiet" @click="recipes.fetchAll({ force: true })">
        <RotateCw :size="17" aria-hidden="true" /> Reintentar
      </button>
    </div>

    <div v-else-if="!items.length" class="panel state empty">
      <p>Para armar la semana primero necesitas recetas.</p>
      <RouterLink to="/recetas" class="btn btn-primary">Agregar recetas</RouterLink>
    </div>

    <template v-else>
      <!-- Escritorio: tabla comidas × días -->
      <div class="week panel" role="table" aria-label="Plan de comidas de la semana">
        <div class="row head" role="row">
          <span class="corner" role="columnheader"><span class="visually-hidden">Comida</span></span>
          <span v-for="day in days" :key="day.key" class="day" :class="{ today: day.isToday }" role="columnheader">
            <span class="day-name">{{ day.weekday }}</span>
            <span class="day-num num">{{ day.date }}</span>
          </span>
        </div>

        <div v-for="meal in MEALS" :key="meal.id" class="row" role="row">
          <span class="meal" role="rowheader">
            <span class="magnet-dot" :class="`m-${meal.magnet}`" aria-hidden="true"></span>
            {{ meal.label }}
          </span>
          <span v-for="day in days" :key="day.key" class="cell" :class="{ today: day.isToday, filled: plan.get(day.key, meal.id) }" role="cell">
            <label class="visually-hidden" :for="`d-${day.key}-${meal.id}`">{{ meal.label }} del {{ day.weekday }} {{ day.date }}</label>
            <select :id="`d-${day.key}-${meal.id}`" class="select slot" :value="plan.get(day.key, meal.id)" @change="plan.set(day.key, meal.id, $event.target.value)">
              <option value="">—</option>
              <optgroup v-if="options[meal.id].fits.length" :label="meal.label">
                <option v-for="r in options[meal.id].fits" :key="r.id" :value="r.id">{{ r.name }}</option>
              </optgroup>
              <optgroup v-if="options[meal.id].others.length" label="Otras recetas">
                <option v-for="r in options[meal.id].others" :key="r.id" :value="r.id">{{ r.name }}</option>
              </optgroup>
            </select>
          </span>
        </div>
      </div>

      <!-- Celular: un bloque por día -->
      <ol class="days-list">
        <li v-for="day in days" :key="day.key" class="day-card panel" :class="{ today: day.isToday }">
          <h2 class="day-card-title">
            <span class="day-card-name">{{ day.weekday }}</span>
            <span class="num">{{ day.date }}</span>
            <span v-if="day.isToday" class="today-pill">Hoy</span>
          </h2>
          <div v-for="meal in MEALS" :key="meal.id" class="day-card-row" :class="{ filled: plan.get(day.key, meal.id) }">
            <label class="day-card-meal" :for="`m-${day.key}-${meal.id}`">
              <span class="magnet-dot" :class="`m-${meal.magnet}`" aria-hidden="true"></span>
              {{ meal.label }}
            </label>
            <select :id="`m-${day.key}-${meal.id}`" class="select slot" :value="plan.get(day.key, meal.id)" @change="plan.set(day.key, meal.id, $event.target.value)">
              <option value="">Sin planear</option>
              <optgroup v-if="options[meal.id].fits.length" :label="meal.label">
                <option v-for="r in options[meal.id].fits" :key="r.id" :value="r.id">{{ r.name }}</option>
              </optgroup>
              <optgroup v-if="options[meal.id].others.length" label="Otras recetas">
                <option v-for="r in options[meal.id].others" :key="r.id" :value="r.id">{{ r.name }}</option>
              </optgroup>
            </select>
          </div>
        </li>
      </ol>
    </template>
  </div>
</template>

<style scoped>
.state { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.empty { padding: 1.5rem; justify-content: space-between; }
.empty .btn { text-decoration: none; }

.week { padding: 0.75rem; }
.row {
  display: grid;
  grid-template-columns: 116px repeat(7, minmax(0, 1fr));
  column-gap: 0.4rem;
  align-items: stretch;
}

.day {
  display: grid; justify-items: center; gap: 0.05rem;
  padding: 0.6rem 0;
  text-transform: capitalize;
}
.day-name { font-size: 0.8rem; font-weight: 600; color: var(--ink-faint); }
.day-num { font-family: var(--font-display); font-size: 1.25rem; font-weight: 650; }

.meal { display: flex; align-items: center; gap: 0.55rem; font-weight: 600; padding-left: 0.5rem; }

.cell { padding: 0.2rem 0; }
/* La columna de hoy es una banda continua de menta */
.day.today, .cell.today { background: var(--mint); padding-inline: 0.3rem; }
.day.today { border-radius: var(--radius-m) var(--radius-m) 0 0; }
.day.today .day-name { color: var(--mint-ink); }
.row:last-child .cell.today { border-radius: 0 0 var(--radius-m) var(--radius-m); padding-bottom: 0.3rem; }

.slot {
  min-height: 64px; padding: 0.5rem 1.6rem 0.5rem 0.6rem;
  font-size: 0.85rem; line-height: 1.25;
  white-space: normal;
  background-color: var(--enamel);
  border-style: dashed;
  border-color: #cddad3;
  background-position: right 0.4rem center;
}
.filled > .slot, .filled .slot { background-color: var(--enamel-raised); border-style: solid; border-color: var(--line); color: var(--ink); font-weight: 600; box-shadow: var(--shadow-raised); }

.days-list { display: none; }

@media (max-width: 860px) {
  .week { display: none; }
  .days-list { display: grid; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
  .day-card { padding: 1rem 1.1rem; display: grid; gap: 0.6rem; }
  .day-card.today { background: var(--mint); border-color: var(--mint-deep); }
  .day-card-title { display: flex; align-items: baseline; gap: 0.4rem; font-size: 1.15rem; }
  .day-card-name { text-transform: capitalize; }
  .today-pill {
    margin-left: auto; align-self: center;
    font: 700 0.75rem var(--font-ui); padding: 0.15rem 0.6rem; border-radius: 999px;
    background: var(--herb); color: #fff;
  }
  .day-card-row { display: grid; grid-template-columns: 104px minmax(0, 1fr); align-items: center; gap: 0.6rem; }
  .day-card-meal { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 600; }
  .day-card-row .slot { min-height: 44px; }
}
</style>
