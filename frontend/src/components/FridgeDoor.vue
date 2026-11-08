<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { X, Plus, ChefHat } from 'lucide-vue-next';
import { useFridgeStore } from '@/stores/fridge';
import { CATEGORIES, categoryById, guessCategory, type IngredientCategory } from '@/lib/kitchen';
import type { FridgeItem } from '@/stores/fridge';

const fridge = useFridgeStore();
const { sorted } = storeToRefs(fridge);

const name = ref('');
const category = ref<IngredientCategory>('fresco');
const categoryTouched = ref(false);
const feedback = ref('');

// Sugiere la categoría mientras escribe, salvo que el usuario ya la haya elegido
watch(name, (value) => {
  if (!categoryTouched.value) category.value = guessCategory(value);
});

function add() {
  const clean = name.value.trim();
  if (!clean) return;
  if (fridge.add(clean, category.value)) {
    feedback.value = `${clean} agregado a la nevera.`;
    name.value = '';
    categoryTouched.value = false;
  } else {
    feedback.value = `${clean} ya está en la nevera.`;
  }
}

function remove(item: FridgeItem) {
  fridge.remove(item.id);
  feedback.value = `${item.name} quitado de la nevera.`;
}
</script>

<template>
  <section class="door" aria-labelledby="door-title">
    <span class="handle" aria-hidden="true"></span>

    <header class="door-head">
      <h2 id="door-title">Mi nevera</h2>
      <p class="num">{{ sorted.length }} {{ sorted.length === 1 ? 'ingrediente' : 'ingredientes' }}</p>
    </header>

    <TransitionGroup v-if="sorted.length" tag="ul" name="magnet" class="magnets" aria-label="Ingredientes disponibles">
      <li v-for="item in sorted" :key="item.id" class="magnet" :class="`m-${categoryById(item.category).magnet}`">
        <span class="magnet-dot" aria-hidden="true"></span>
        <span>{{ item.name }}</span>
        <button type="button" class="magnet-remove" :aria-label="`Quitar ${item.name}`" @click="remove(item)">
          <X :size="15" :stroke-width="2.4" aria-hidden="true" />
        </button>
      </li>
    </TransitionGroup>

    <p v-else class="empty">
      Tu nevera está vacía. Agrega lo que tienes en casa, por ejemplo <em>tomate</em>, <em>huevos</em> o <em>arroz</em>.
    </p>

    <form class="add" @submit.prevent="add">
      <label class="visually-hidden" for="ingredient">Ingrediente</label>
      <input id="ingredient" v-model="name" class="input" placeholder="Agregar ingrediente" autocomplete="off" maxlength="40" />
      <label class="visually-hidden" for="ingredient-category">Categoría</label>
      <select id="ingredient-category" v-model="category" class="select" @change="categoryTouched = true">
        <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
      </select>
      <button type="submit" class="btn btn-quiet add-btn" :disabled="!name.trim()">
        <Plus :size="18" aria-hidden="true" />
        <span>Agregar</span>
      </button>
    </form>
    <p class="visually-hidden" aria-live="polite">{{ feedback }}</p>

    <div class="cook">
      <button type="button" class="btn btn-primary cook-btn" disabled aria-describedby="cook-note">
        <ChefHat :size="19" aria-hidden="true" />
        ¿Qué cocino con esto?
      </button>
      <p id="cook-note" class="cook-note">Se activa cuando conectemos Gemini. También podrás pedirlo por WhatsApp.</p>
    </div>
  </section>
</template>

<style scoped>
.door {
  position: relative;
  display: grid; gap: 1.25rem; align-content: start;
  padding: 1.5rem 1.5rem 1.5rem 2.25rem;
  background: var(--mint);
  border: 1px solid var(--mint-deep);
  border-radius: var(--radius-l);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.7), 0 10px 30px -18px rgb(22 36 30 / 0.45);
}

/* Manija de la puerta */
.handle {
  position: absolute; left: 0.85rem; top: 1.5rem;
  width: 6px; height: 72px; border-radius: 3px;
  background: var(--mint-deep);
  box-shadow: inset 0 1px 1px rgb(22 36 30 / 0.18), 0 1px 0 rgb(255 255 255 / 0.8);
}

.door-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.door-head h2 { font-size: 1.35rem; }
.door-head p { font-size: 0.88rem; color: var(--mint-ink); }

.magnets { display: flex; flex-wrap: wrap; gap: 0.55rem; margin: 0; padding: 0; list-style: none; }

.magnet-remove {
  display: grid; place-items: center;
  width: 28px; height: 28px; margin-left: 0.1rem;
  border: 0; border-radius: 8px;
  background: transparent; color: inherit; opacity: 0.6;
  cursor: pointer;
  transition: opacity 120ms var(--ease-out), background-color 120ms var(--ease-out);
}
.magnet-remove:focus-visible { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .magnet-remove:hover { opacity: 1; background: rgb(255 255 255 / 0.55); }
}

/* El "snap" del imán al pegarse */
.magnet-enter-active { animation: magnet-snap 260ms var(--ease-out); }
.magnet-leave-active { transition: opacity 140ms var(--ease-out), transform 140ms var(--ease-out); position: absolute; }
.magnet-leave-to { opacity: 0; transform: scale(0.95); }
.magnet-move { transition: transform 220ms var(--ease-out); }

@keyframes magnet-snap {
  0% { opacity: 0; transform: translateY(-8px) scale(0.96); }
  65% { opacity: 1; transform: translateY(1px) scale(1.01); }
  100% { transform: none; }
}

.empty { color: var(--mint-ink); max-width: 42ch; }

.add { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
.add .input { grid-column: 1 / -1; }
.add-btn:disabled { opacity: 0.6; }

.cook { display: grid; gap: 0.5rem; padding-top: 1.25rem; border-top: 1px solid var(--mint-deep); }
.cook-btn { min-height: 50px; font-size: 1rem; }
.cook-note { font-size: 0.85rem; color: var(--mint-ink); }

@media (max-width: 520px) {
  .door { padding: 1.25rem 1.1rem 1.25rem 1.9rem; }
  .handle { left: 0.7rem; height: 56px; }
}
</style>
