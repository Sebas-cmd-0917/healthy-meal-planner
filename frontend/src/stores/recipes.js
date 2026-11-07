import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';

export const useRecipesStore = defineStore('recipes', () => {
  const items = ref([]);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref(null);

  const byId = computed(() => new Map(items.value.map((r) => [r.id, r])));

  async function fetchAll({ force = false } = {}) {
    if (loaded.value && !force) return;
    loading.value = true;
    error.value = null;
    try {
      items.value = await api.recipes.list();
      loaded.value = true;
    } catch {
      error.value = 'No pudimos conectar con el servidor.';
    } finally {
      loading.value = false;
    }
  }

  async function create(recipe) {
    const created = await api.recipes.create(recipe);
    items.value.unshift(created);
    return created;
  }

  return { items, byId, loading, loaded, error, fetchAll, create };
});
