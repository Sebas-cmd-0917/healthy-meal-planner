<script setup>
import { onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Flame, Plus, RotateCw } from 'lucide-vue-next';
import { useRecipesStore } from '@/stores/recipes';
import { MEALS, mealOfRecipe } from '@/lib/kitchen';

const store = useRecipesStore();
const { items, loading, loaded, error } = storeToRefs(store);

const form = reactive({ name: '', meal: 'almuerzo', calories: '', tags: '' });
const saving = ref(false);
const formError = ref('');

const mealIds = MEALS.map((m) => m.id);
const extraTags = (recipe) => recipe.tags.filter((t) => !mealIds.includes(t));

onMounted(() => store.fetchAll());

async function submit() {
  formError.value = '';
  saving.value = true;
  try {
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    await store.create({
      name: form.name,
      calories: form.calories === '' ? null : Number(form.calories),
      tags: [form.meal, ...tags],
    });
    Object.assign(form, { name: '', calories: '', tags: '' });
  } catch (e) {
    formError.value = e.message === 'Failed to fetch' ? 'No pudimos guardar: el servidor no responde.' : e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1>Recetas</h1>
      <p>Tus recetas, listas para usar en el plan de la semana.</p>
    </header>

    <form class="new panel" @submit.prevent="submit">
      <h2>Nueva receta</h2>
      <div class="fields">
        <label class="field name">
          <span class="field-label">Nombre</span>
          <input v-model="form.name" class="input" required maxlength="80" placeholder="Bowl de quinoa con aguacate" />
        </label>
        <label class="field">
          <span class="field-label">Comida</span>
          <select v-model="form.meal" class="select">
            <option v-for="m in MEALS" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Calorías</span>
          <input v-model="form.calories" class="input num" type="number" min="0" inputmode="numeric" placeholder="450" />
        </label>
        <label class="field tags">
          <span class="field-label">Etiquetas <span class="hint">(separadas por coma)</span></span>
          <input v-model="form.tags" class="input" placeholder="vegano, rápido" />
        </label>
      </div>
      <div class="actions">
        <p v-if="formError" class="notice notice-error" role="alert">{{ formError }}</p>
        <button type="submit" class="btn btn-primary" :disabled="saving || !form.name.trim()">
          <Plus :size="18" aria-hidden="true" /> {{ saving ? 'Guardando…' : 'Guardar receta' }}
        </button>
      </div>
    </form>

    <section class="list-section" aria-labelledby="list-title">
      <h2 id="list-title">Mis recetas <span v-if="items.length" class="count num">{{ items.length }}</span></h2>

      <p v-if="loading && !loaded" class="notice">Cargando recetas…</p>
      <div v-else-if="error" class="notice notice-error state">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-quiet" @click="store.fetchAll({ force: true })">
          <RotateCw :size="17" aria-hidden="true" /> Reintentar
        </button>
      </div>
      <p v-else-if="!items.length" class="notice">Aún no tienes recetas. Guarda la primera con el formulario de arriba.</p>

      <ul v-else class="list panel">
        <li v-for="r in items" :key="r.id" class="recipe">
          <span class="magnet-dot" :class="`m-${mealOfRecipe(r)?.magnet ?? 'hoja'}`" aria-hidden="true"></span>
          <div class="recipe-body">
            <p class="recipe-name">{{ r.name }}</p>
            <p class="recipe-meta">
              {{ mealOfRecipe(r)?.label ?? 'Sin comida asignada' }}<template v-if="extraTags(r).length"> · {{ extraTags(r).join(', ') }}</template>
            </p>
          </div>
          <p v-if="r.calories != null" class="recipe-kcal num"><Flame :size="15" aria-hidden="true" />{{ r.calories }} kcal</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.new { padding: 1.5rem; display: grid; gap: 1.25rem; }
.new h2 { font-size: 1.2rem; }
.fields { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; }
.fields .tags { grid-column: 1 / -1; }
.hint { font-weight: 400; color: var(--ink-faint); }
.actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 1rem; }
.actions .btn:disabled { opacity: 0.55; }

.list-section { display: grid; gap: 1rem; }
.list-section h2 { font-size: 1.35rem; display: flex; align-items: center; gap: 0.6rem; }
.count {
  font-family: var(--font-ui); font-size: 0.8rem; font-weight: 700;
  padding: 0.15rem 0.55rem; border-radius: 999px; background: var(--mint); color: var(--mint-ink);
}
.state { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }

.list { margin: 0; padding: 0 1.5rem; list-style: none; }
.recipe {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--line);
}
.recipe:first-child { border-top: 0; }
.recipe .magnet-dot { width: 12px; height: 12px; }
.recipe-name { font-family: var(--font-display); font-size: 1.1rem; font-weight: 600; letter-spacing: -0.01em; }
.recipe-meta { font-size: 0.86rem; color: var(--ink-faint); }
.recipe-kcal { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.88rem; color: var(--ink-soft); white-space: nowrap; }

@media (max-width: 720px) {
  .fields { grid-template-columns: 1fr 1fr; }
  .fields .name { grid-column: 1 / -1; }
  .actions .btn { width: 100%; }
  .list { padding: 0 1.1rem; }
}
</style>
