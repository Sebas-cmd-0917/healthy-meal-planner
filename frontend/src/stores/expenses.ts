import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api, errorMessage } from '@/services/api';
import { addDays, dayKey, startOfWeek } from '@/lib/kitchen';
import type { Expense, ExpenseSummary, NewExpense } from '@/types/api';

export type Period = 'dia' | 'semana' | 'mes';

/** Rango [desde, hasta] del periodo que contiene `anchor`. */
function rangeFor(period: Period, anchor: Date): [Date, Date] {
  if (period === 'dia') return [anchor, anchor];
  if (period === 'semana') {
    const start = startOfWeek(anchor);
    return [start, addDays(start, 6)];
  }
  return [new Date(anchor.getFullYear(), anchor.getMonth(), 1), new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)];
}

const EMPTY_SUMMARY: ExpenseSummary = { total: 0, count: 0, byCategory: [], byDay: [] };

export const useExpensesStore = defineStore('expenses', () => {
  const period = ref<Period>('semana');
  const anchor = ref(new Date());
  const items = ref<Expense[]>([]);
  const summary = ref<ExpenseSummary>(EMPTY_SUMMARY);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const range = computed(() => rangeFor(period.value, anchor.value));

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const [from, to] = range.value;
      ({ items: items.value, summary: summary.value } = await api.expenses.list(dayKey(from), dayKey(to)));
    } catch (e) {
      error.value = errorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  function setPeriod(p: Period) {
    period.value = p;
    anchor.value = new Date();
    return load();
  }

  function shift(step: number) {
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

  async function create(expense: NewExpense) {
    await api.expenses.create([expense]);
    await load();
  }

  async function remove(expense: Expense) {
    await api.expenses.remove(expense.id);
    await load();
  }

  return { period, anchor, range, items, summary, loading, error, isCurrent, load, setPeriod, shift, create, remove };
});
