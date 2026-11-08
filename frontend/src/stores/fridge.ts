import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { loadJSON, saveJSON } from '@/lib/storage';
import { CATEGORIES, type IngredientCategory } from '@/lib/kitchen';

export interface FridgeItem {
  id: string;
  name: string;
  category: IngredientCategory;
}

const KEY = 'hmp.fridge';

// Por ahora la nevera vive en este navegador; luego pasa al backend (Supabase).
export const useFridgeStore = defineStore('fridge', () => {
  const items = ref<FridgeItem[]>(loadJSON<FridgeItem[]>(KEY, []));

  watch(items, (value) => saveJSON(KEY, value), { deep: true });

  const sorted = computed(() => {
    const order = CATEGORIES.map((c) => c.id);
    return [...items.value].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  });

  /** false si está vacío o ya existe */
  function add(name: string, category: IngredientCategory): boolean {
    const clean = name.trim();
    if (!clean) return false;
    if (items.value.some((i) => i.name.toLowerCase() === clean.toLowerCase())) return false;
    items.value.push({ id: crypto.randomUUID(), name: clean, category });
    return true;
  }

  function remove(id: string) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  return { items, sorted, add, remove };
});
