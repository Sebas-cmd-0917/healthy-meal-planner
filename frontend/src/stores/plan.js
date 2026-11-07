import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { loadJSON, saveJSON } from '@/lib/storage';

const KEY = 'hmp.plan';

// { 'YYYY-MM-DD': { desayuno: recipeId, almuerzo: recipeId, cena: recipeId } }
export const usePlanStore = defineStore('plan', () => {
  const slots = ref(loadJSON(KEY, {}));

  watch(slots, (value) => saveJSON(KEY, value), { deep: true });

  const get = (day, meal) => slots.value[day]?.[meal] ?? '';

  function set(day, meal, recipeId) {
    const entry = { ...(slots.value[day] ?? {}) };
    if (recipeId) entry[meal] = recipeId;
    else delete entry[meal];
    slots.value = { ...slots.value, [day]: entry };
  }

  return { slots, get, set };
});
