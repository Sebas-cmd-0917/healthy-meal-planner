import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { addDays, dayKey, startOfWeek } from '@/lib/kitchen';

const message = (e) => (e?.message === 'Failed to fetch' ? 'No pudimos conectar con el servidor.' : e?.message);

/** Rango [desde, hasta] del periodo que contiene `anchor`. */
function rangeFor(period, anchor) {
  if (period === 'dia') return [anchor, anchor];
  if (period === 'semana') {
    const start = startOfWeek(anchor);
    return [start, addDays(start, 6)];
  }
  return [new Date(anchor.getFullYear(), anchor.getMonth(), 1), new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)];
}

export const useExpensesStore = defineStore('expenses', () => {
  const period = ref('semana');
  const anchor = ref(new Date());
  const items = ref([]);
  const summary = ref({ total: 0, count: 0, byCategory: [], byDay: [] });
  const loading = ref(false);
  const error = ref(null);

  const range = computed(() => rangeFor(period.value, anchor.value));

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const [from, to] = range.value;
      ({ items: items.value, summary: summary.value } = await api.expenses.list(dayKey(from), dayKey(to)));
    } catch (e) {
      error.value = message(e);
    } finally {
      loading.value = false;
    }
  }

  function setPeriod(p) {
    period.value = p;
    anchor.value = new Date();
    return load();
  }

  function shift(step) {
    const a = new Date(anchor.value);
    if (period.value === 'dia') a.setDate(a.getDate() + step);
    else if (period.value === 'semana') a.setDate(a.getDate() + step * 7);
    else a.setMonth(a.getMonth() + step, 1);
    anchor.value = a;
    return load();
  }

  const isCurrent = computed(() => {
    const [from, to] = range.value;
    const today = dayKey(new Date());
    return dayKey(from) <= today && today <= dayKey(to);
  });

  async function create(expense) {
    try {
      await api.expenses.create([expense]);
    } catch (e) {
      throw new Error(message(e));
    }
    await load();
  }

  async function remove(expense) {
    try {
      await api.expenses.remove(expense.id);
    } catch (e) {
      throw new Error(message(e));
    }
    await load();
  }

  return { period, anchor, range, items, summary, loading, error, isCurrent, load, setPeriod, shift, create, remove };
});
