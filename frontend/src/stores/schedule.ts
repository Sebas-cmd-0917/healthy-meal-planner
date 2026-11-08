import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, errorMessage } from '@/services/api';
import { addDays, dayKey, startOfWeek } from '@/lib/kitchen';
import type { ISODate, NewScheduleBlock, ScheduleBlock, ScheduleBlockChanges } from '@/types/api';

export const useScheduleStore = defineStore('schedule', () => {
  const weekStart = ref(startOfWeek());
  const blocks = ref<ScheduleBlock[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const today = ref<ScheduleBlock[]>([]);
  const todayError = ref<string | null>(null);

  const weekEnd = computed(() => addDays(weekStart.value, 6));

  /** Bloques agrupados por día */
  const byDay = computed(() => {
    const groups: Record<ISODate, ScheduleBlock[]> = {};
    for (const b of blocks.value) (groups[b.date] ??= []).push(b);
    return groups;
  });

  async function loadWeek(start: Date = weekStart.value) {
    weekStart.value = startOfWeek(start);
    loading.value = true;
    error.value = null;
    try {
      blocks.value = await api.schedule.list(dayKey(weekStart.value), dayKey(weekEnd.value));
    } catch (e) {
      error.value = errorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  const shiftWeek = (weeks: number) => loadWeek(addDays(weekStart.value, weeks * 7));

  async function loadToday() {
    todayError.value = null;
    const key = dayKey(new Date());
    try {
      today.value = await api.schedule.list(key, key);
    } catch (e) {
      todayError.value = errorMessage(e);
    }
  }

  async function create(block: NewScheduleBlock) {
    await api.schedule.create([block]);
    await loadWeek();
  }

  /** Reemplaza el bloque en las listas cargadas (semana y hoy) */
  function replace(updated: ScheduleBlock) {
    const swap = (list: ScheduleBlock[]) => list.map((b) => (b.id === updated.id ? updated : b));
    blocks.value = swap(blocks.value);
    today.value = swap(today.value);
  }

  async function update(id: string, changes: ScheduleBlockChanges) {
    replace(await api.schedule.update(id, changes));
  }

  const toggleDone = (block: ScheduleBlock) => update(block.id, { done: !block.done });

  async function remove(id: string) {
    await api.schedule.remove(id);
    blocks.value = blocks.value.filter((b) => b.id !== id);
    today.value = today.value.filter((b) => b.id !== id);
  }

  return {
    weekStart, weekEnd, blocks, byDay, loading, error, today, todayError,
    loadWeek, shiftWeek, loadToday, create, update, toggleDone, remove,
  };
});
