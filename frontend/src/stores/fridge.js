import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { loadJSON, saveJSON } from '@/lib/storage';
import { CATEGORIES } from '@/lib/kitchen';

const KEY = 'hmp.fridge';

// Por ahora la nevera vive en este navegador; luego pasa al backend (Supabase).
export const useFridgeStore = defineStore('fridge', () => {
  const items = ref(loadJSON(KEY, []));

  watch(items, (value) => saveJSON(KEY, value), { deep: true });

  const sorted = computed(() => {
    const order = CATEGORIES.map((c) => c.id);
    return [...items.value].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  });

  function add(name, category) {
    const clean = name.trim();
    if (!clean) return false;
    if (items.value.some((i) => i.name.toLowerCase() === clean.toLowerCase())) return false;
    items.value.push({ id: crypto.randomUUID(), name: clean, category });
    return true;
  }

  function remove(id) {
    items.value = items.value.filter((i) => i.id !== id);
  }

  return { items, sorted, add, remove };
});
