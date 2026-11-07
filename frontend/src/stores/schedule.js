import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { addDays, dayKey, startOfWeek } from '@/lib/kitchen';

const NETWORK_ERROR = 'No pudimos conectar con el servidor.';
const message = (e) => (e?.message === 'Failed to fetch' ? NETWORK_ERROR : e?.message ?? NETWORK_ERROR);

export const useScheduleStore = defineStore('schedule', () => {
  const weekStart = ref(startOfWeek());
  const blocks = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const today = ref([]);
  const todayError = ref(null);

  const weekEnd = computed(() => addDays(weekStart.value, 6));

  /** Bloques agrupados por día: { 'YYYY-MM-DD': [...] } */
  const byDay = computed(() => {
    const groups = {};
    for (const b of blocks.value) (groups[b.date] ??= []).push(b);
    return groups;
  });

  async function loadWeek(start = weekStart.value) {
    weekStart.value = startOfWeek(start);
    loading.value = true;
    error.value = null;
    try {
      blocks.value = await api.schedule.list(dayKey(weekStart.value), dayKey(weekEnd.value));
    } catch (e) {
      error.value = message(e);
    } finally {
      loading.value = false;
    }
  }

  const shiftWeek = (weeks) => loadWeek(addDays(weekStart.value, weeks * 7));

  async function loadToday() {
    todayError.value = null;
    const key = dayKey(new Date());
    try {
      today.value = await api.schedule.list(key, key);
    } catch (e) {
      todayError.value = message(e);
    }
  }

  async function create(block) {
    try {
      await api.schedule.create([block]);
    } catch (e) {
      throw new Error(message(e));
    }
    await loadWeek();
  }

  async function remove(id) {
    try {
      await api.schedule.remove(id);
    } catch (e) {
      throw new Error(message(e));
    }
    blocks.value = blocks.value.filter((b) => b.id !== id);
    today.value = today.value.filter((b) => b.id !== id);
  }

  return { weekStart, weekEnd, blocks, byDay, loading, error, today, todayError, loadWeek, shiftWeek, loadToday, create, remove };
});
