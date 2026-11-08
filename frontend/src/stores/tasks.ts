import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, errorMessage } from '@/services/api';
import { addDays, dayKey, startOfWeek } from '@/lib/kitchen';
import type { ISODate, NewTask, Task } from '@/types/api';

export const useTasksStore = defineStore('tasks', () => {
  const weekStart = ref(startOfWeek());
  const items = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const today = ref<Task[]>([]);

  const weekEnd = computed(() => addDays(weekStart.value, 6));
  const byDay = computed(() => {
    const groups: Record<ISODate, Task[]> = {};
    for (const t of items.value) (groups[t.date] ??= []).push(t);
    return groups;
  });
  const summary = computed(() => {
    const total = items.value.length;
    const done = items.value.filter((t) => t.done).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  });

  async function loadWeek(start: Date = weekStart.value) {
    weekStart.value = startOfWeek(start);
    loading.value = true;
    error.value = null;
    try {
      ({ items: items.value } = await api.tasks.list(dayKey(weekStart.value), dayKey(weekEnd.value)));
    } catch (e) {
      error.value = errorMessage(e);
    } finally {
      loading.value = false;
    }
  }
  const shiftWeek = (weeks: number) => loadWeek(addDays(weekStart.value, weeks * 7));

  async function loadToday() {
    const key = dayKey(new Date());
    try {
      ({ items: today.value } = await api.tasks.list(key, key));
    } catch {
      today.value = [];
    }
  }

  const inLoadedWeek = (date: ISODate) => date >= dayKey(weekStart.value) && date <= dayKey(weekEnd.value);
  const swap = (list: Task[], updated: Task) => list.map((t) => (t.id === updated.id ? updated : t));

  async function create(task: NewTask) {
    const [created] = await api.tasks.create([task]);
    if (!created) return;
    if (inLoadedWeek(created.date)) items.value.push(created);
    if (created.date === dayKey(new Date())) today.value.push(created);
  }

  async function toggle(task: Task) {
    const updated = await api.tasks.update(task.id, { done: !task.done });
    items.value = swap(items.value, updated);
    today.value = swap(today.value, updated);
  }

  async function remove(task: Task) {
    await api.tasks.remove(task.id);
    items.value = items.value.filter((t) => t.id !== task.id);
    today.value = today.value.filter((t) => t.id !== task.id);
  }

  return { weekStart, weekEnd, items, byDay, summary, loading, error, today, loadWeek, shiftWeek, loadToday, create, toggle, remove };
});
