import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { addDays, dayKey, startOfWeek } from '@/lib/kitchen';

const message = (e) => (e?.message === 'Failed to fetch' ? 'No pudimos conectar con el servidor.' : e?.message);

export const useTasksStore = defineStore('tasks', () => {
  const weekStart = ref(startOfWeek());
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const today = ref([]);

  const weekEnd = computed(() => addDays(weekStart.value, 6));
  const byDay = computed(() => {
    const groups = {};
    for (const t of items.value) (groups[t.date] ??= []).push(t);
    return groups;
  });
  const summary = computed(() => {
    const done = items.value.filter((t) => t.done).length;
    return { total: items.value.length, done, percent: items.value.length ? Math.round((done / items.value.length) * 100) : 0 };
  });

  async function loadWeek(start = weekStart.value) {
    weekStart.value = startOfWeek(start);
    loading.value = true;
    error.value = null;
    try {
      ({ items: items.value } = await api.tasks.list(dayKey(weekStart.value), dayKey(weekEnd.value)));
    } catch (e) {
      error.value = message(e);
    } finally {
      loading.value = false;
    }
  }
  const shiftWeek = (weeks) => loadWeek(addDays(weekStart.value, weeks * 7));

  async function loadToday() {
    const key = dayKey(new Date());
    try {
      ({ items: today.value } = await api.tasks.list(key, key));
    } catch {
      today.value = [];
    }
  }

  const withError = async (fn) => {
    try {
      return await fn();
    } catch (e) {
      throw new Error(message(e));
    }
  };

  async function create(task) {
    const [created] = await withError(() => api.tasks.create([task]));
    if (created.date >= dayKey(weekStart.value) && created.date <= dayKey(weekEnd.value)) items.value.push(created);
    if (created.date === dayKey(new Date())) today.value.push(created);
  }

  async function toggle(task) {
    const updated = await withError(() => api.tasks.update(task.id, { done: !task.done }));
    const swap = (list) => list.map((t) => (t.id === updated.id ? updated : t));
    items.value = swap(items.value);
    today.value = swap(today.value);
  }

  async function remove(task) {
    await withError(() => api.tasks.remove(task.id));
    items.value = items.value.filter((t) => t.id !== task.id);
    today.value = today.value.filter((t) => t.id !== task.id);
  }

  return { weekStart, weekEnd, items, byDay, summary, loading, error, today, loadWeek, shiftWeek, loadToday, create, toggle, remove };
});
