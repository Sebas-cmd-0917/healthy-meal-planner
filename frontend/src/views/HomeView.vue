<script setup>
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { Flame } from 'lucide-vue-next';
import FridgeDoor from '@/components/FridgeDoor.vue';
import { useRecipesStore } from '@/stores/recipes';
import { usePlanStore } from '@/stores/plan';
import { MEALS, dayKey } from '@/lib/kitchen';

const recipes = useRecipesStore();
const plan = usePlanStore();
const { byId } = storeToRefs(recipes);

const today = new Date();
const todayKey = dayKey(today);
const dateLabel = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(today);
const title = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

const meals = computed(() =>
  MEALS.map((meal) => ({ ...meal, recipe: byId.value.get(plan.get(todayKey, meal.id)) ?? null })),
);
const planned = computed(() => meals.value.filter((m) => m.recipe).length);

onMounted(() => recipes.fetchAll());
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>{{ title }}</h1>
      <p>Qué comes hoy y qué tienes en casa.</p>
    </header>

    <div class="today">
      <section class="meals panel" aria-labelledby="meals-title">
        <header class="meals-head">
          <h2 id="meals-title">Comidas de hoy</h2>
          <p class="num">{{ planned }} de 3 planeadas</p>
        </header>

        <ol class="meal-list">
          <li v-for="meal in meals" :key="meal.id" class="meal">
            <span class="magnet-dot meal-dot" :class="`m-${meal.magnet}`" aria-hidden="true"></span>
            <div class="meal-body">
              <p class="meal-label">{{ meal.label }}</p>
              <p v-if="meal.recipe" class="meal-name">{{ meal.recipe.name }}</p>
              <p v-else class="meal-empty">Sin planear · <RouterLink to="/plan">Elegir receta</RouterLink></p>
            </div>
            <p v-if="meal.recipe?.calories != null" class="meal-kcal num">
              <Flame :size="15" aria-hidden="true" />{{ meal.recipe.calories }} kcal
            </p>
          </li>
        </ol>

        <p v-if="recipes.error" class="notice notice-error">{{ recipes.error }} Las recetas del plan no se pueden mostrar.</p>
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

.meals { padding: 1.5rem; display: grid; gap: 1rem; }
.meals-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.meals-head h2 { font-size: 1.35rem; }
.meals-head p { font-size: 0.88rem; color: var(--ink-faint); }

.meal-list { margin: 0; padding: 0; list-style: none; }
.meal {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem;
  padding: 1.1rem 0;
  border-top: 1px solid var(--line);
}
.meal:first-child { border-top: 0; padding-top: 0.25rem; }
.meal-dot { width: 14px; height: 14px; }
.meal-label { font-size: 0.82rem; font-weight: 600; color: var(--ink-faint); }
.meal-name { font-family: var(--font-display); font-size: 1.2rem; font-weight: 600; letter-spacing: -0.01em; }
.meal-empty { color: var(--ink-soft); }
.meal-kcal { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.88rem; color: var(--ink-soft); white-space: nowrap; }

@media (max-width: 1024px) {
  .today { grid-template-columns: 1fr; }
}
@media (max-width: 860px) {
  /* En el celular la nevera va primero: es la acción del momento */
  .today > :last-child { order: -1; }
}
</style>
