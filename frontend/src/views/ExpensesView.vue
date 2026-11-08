<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Plus, RotateCw, X } from 'lucide-vue-next';
import WeekNav from '@/components/WeekNav.vue';
import { useExpensesStore, type Period } from '@/stores/expenses';
import { errorMessage } from '@/services/api';
import type { Expense, ExpenseCategory, ISODate } from '@/types/api';
import { EXPENSE_CATEGORIES, dayKey, expenseCategoryLabel, formatCOP, parseDay } from '@/lib/kitchen';

const expenses = useExpensesStore();
const { period, range, items, summary, loading, error, isCurrent } = storeToRefs(expenses);

const PERIODS: { id: Period; label: string; current: string; prev: string; next: string }[] = [
  { id: 'dia', label: 'Día', current: 'Hoy', prev: 'Día anterior', next: 'Día siguiente' },
  { id: 'semana', label: 'Semana', current: 'Esta semana', prev: 'Semana anterior', next: 'Semana siguiente' },
  { id: 'mes', label: 'Mes', current: 'Este mes', prev: 'Mes anterior', next: 'Mes siguiente' },
];
const activePeriod = computed(() => PERIODS.find((p) => p.id === period.value) ?? PERIODS[1]!);

const fmtLong = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const rangeLabel = computed(() => {
  const [from, to] = range.value;
  if (period.value === 'dia') return cap(fmtLong.format(from));
  if (period.value === 'semana') return `Semana del ${fmtShort.format(from)} – ${fmtShort.format(to)}`;
  return cap(fmtMonth.format(from));
});

const maxCategory = computed(() => Math.max(1, ...summary.value.byCategory.map((c) => c.total)));

// Gastos agrupados por día, el más reciente primero
const groups = computed(() => {
  const map = new Map<ISODate, Expense[]>();
  for (const e of [...items.value].reverse()) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return [...map].map(([date, list]) => ({
    date, label: cap(fmtLong.format(parseDay(date))), list, total: list.reduce((n, e) => n + e.amount, 0),
  }));
});

const form = reactive<{ amount: string; category: ExpenseCategory; note: string; date: ISODate }>({
  amount: '', category: 'comida', note: '', date: dayKey(new Date()),
});
const saving = ref(false);
const formError = ref('');
const actionError = ref('');

async function submit() {
  formError.value = '';
  saving.value = true;
  try {
    await expenses.create({ ...form });
    Object.assign(form, { amount: '', note: '' });
  } catch (e) {
    formError.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}

async function remove(expense: Expense) {
  actionError.value = '';
  try {
    await expenses.remove(expense);
  } catch (e) {
    actionError.value = errorMessage(e);
  }
}

onMounted(() => expenses.load());
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="page-head">
        <h1>Gastos</h1>
        <p>{{ rangeLabel }}</p>
      </div>
      <div class="controls">
        <div class="segmented" role="group" aria-label="Periodo">
          <button
            v-for="p in PERIODS"
            :key="p.id"
            type="button"
            :aria-pressed="period === p.id"
            @click="expenses.setPeriod(p.id)"
          >{{ p.label }}</button>
        </div>
        <WeekNav
          :is-current="isCurrent"
          :current-label="activePeriod.current"
          :prev-label="activePeriod.prev"
          :next-label="activePeriod.next"
          @prev="expenses.shift(-1)"
          @next="expenses.shift(1)"
          @current="expenses.setPeriod(period)"
        />
      </div>
    </header>

    <section class="total panel" aria-label="Total del periodo">
      <p class="total-label">Total</p>
      <p class="total-value num">{{ formatCOP(summary.total) }}</p>
      <p class="total-count num">{{ summary.count }} {{ summary.count === 1 ? 'gasto' : 'gastos' }}</p>
    </section>

    <div class="layout">
      <div class="main-col">

        <p v-if="actionError" class="notice notice-error" role="alert">{{ actionError }}</p>
        <div v-if="error" class="notice notice-error state">
          <p>{{ error }}</p>
          <button type="button" class="btn btn-quiet" @click="expenses.load()"><RotateCw :size="17" aria-hidden="true" /> Reintentar</button>
        </div>
        <p v-else-if="!loading && !items.length" class="notice">No hay gastos en este periodo.</p>

        <section v-for="g in groups" :key="g.date" class="day panel" :aria-label="g.label">
          <header class="day-head">
            <h2>{{ g.label }}</h2>
            <p class="num">{{ formatCOP(g.total) }}</p>
          </header>
          <ul class="list">
            <li v-for="e in g.list" :key="e.id" class="expense">
              <div>
                <p class="expense-note">{{ e.note || expenseCategoryLabel(e.category) }}</p>
                <p class="expense-cat">{{ expenseCategoryLabel(e.category) }}</p>
              </div>
              <p class="expense-amount num">{{ formatCOP(e.amount) }}</p>
              <button type="button" class="remove" :aria-label="`Quitar gasto de ${formatCOP(e.amount)}`" @click="remove(e)">
                <X :size="15" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </section>
      </div>

      <aside class="side-col">
        <form class="add panel" @submit.prevent="submit">
          <h2>Registrar gasto</h2>
          <label class="field">
            <span class="field-label">Monto (COP)</span>
            <input v-model="form.amount" class="input num" inputmode="numeric" placeholder="15.000" required pattern="[$\s\d.,]+" />
          </label>
          <label class="field">
            <span class="field-label">Categoría</span>
            <select v-model="form.category" class="select">
              <option v-for="c in EXPENSE_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">Nota</span>
            <input v-model="form.note" class="input" maxlength="120" placeholder="Almuerzo en el trabajo" />
          </label>
          <label class="field">
            <span class="field-label">Fecha</span>
            <input v-model="form.date" class="input num" type="date" required />
          </label>
          <p v-if="formError" class="notice notice-error" role="alert">{{ formError }}</p>
          <button type="submit" class="btn btn-primary" :disabled="saving || !form.amount">
            <Plus :size="18" aria-hidden="true" /> {{ saving ? 'Guardando…' : 'Registrar' }}
          </button>
        </form>

        <section v-if="summary.byCategory.length" class="cats panel" aria-labelledby="cats-title">
          <h2 id="cats-title">Por categoría</h2>
          <ul class="cat-list">
            <li v-for="c in summary.byCategory" :key="c.category">
              <div class="cat-row">
                <span>{{ expenseCategoryLabel(c.category) }}</span>
                <span class="num">{{ formatCOP(c.total) }}</span>
              </div>
              <div class="cat-bar" aria-hidden="true"><span :style="{ width: `${(c.total / maxCategory) * 100}%` }"></span></div>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
.controls { display: flex; flex-wrap: wrap; gap: 0.6rem; }

.segmented { display: inline-flex; padding: 3px; border-radius: 12px; background: var(--mint); border: 1px solid var(--mint-deep); }
.segmented button {
  min-height: 38px; padding: 0 0.9rem; border: 0; border-radius: 9px;
  background: transparent; color: var(--mint-ink); font: 600 0.9rem var(--font-ui); cursor: pointer;
  transition: background-color 160ms var(--ease-out);
}
.segmented button[aria-pressed='true'] { background: var(--enamel-raised); color: var(--ink); box-shadow: var(--shadow-raised); }

.layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); gap: 1.5rem; align-items: start; }
.main-col, .side-col { display: grid; gap: 1rem; min-width: 0; }
.state { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }

.total { padding: 1.1rem 1.5rem; display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 0.1rem 1rem; }
.total-label { font-size: 0.85rem; font-weight: 600; color: var(--ink-faint); grid-column: 1 / -1; }
.total-value { font-family: var(--font-display); font-size: clamp(1.8rem, 1.4rem + 1.5vw, 2.4rem); font-weight: 650; letter-spacing: -0.02em; }
.total-count { color: var(--ink-soft); }

.day { padding: 1rem 1.5rem; display: grid; gap: 0.25rem; }
.day-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.day-head h2 { font-size: 1.05rem; }
.day-head p { font-weight: 700; padding-right: calc(28px + 0.75rem); }
.list { margin: 0; padding: 0; list-style: none; }
.expense { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-top: 1px solid var(--line); }
.expense:first-child { border-top: 0; }
.expense-note { font-weight: 600; overflow-wrap: anywhere; }
.expense-cat { font-size: 0.82rem; color: var(--ink-faint); }
.expense-amount { font-weight: 600; white-space: nowrap; }

.remove {
  display: grid; place-items: center; width: 28px; height: 28px; padding: 0;
  border: 0; border-radius: 8px; background: transparent; color: var(--ink-faint); cursor: pointer; opacity: 0.6;
}
.remove:focus-visible { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .remove { opacity: 0; }
  .expense:hover .remove { opacity: 0.7; }
  .remove:hover { opacity: 1; background: var(--enamel); }
}

.add { padding: 1.25rem 1.5rem; display: grid; gap: 0.85rem; }
.add h2, .cats h2 { font-size: 1.1rem; }
.add .btn:disabled { opacity: 0.55; }

.cats { padding: 1.25rem 1.5rem; display: grid; gap: 0.75rem; }
.cat-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.6rem; }
.cat-row { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.9rem; }
.cat-row .num { font-weight: 600; }
.cat-bar { height: 8px; margin-top: 0.25rem; border-radius: 999px; background: var(--enamel); overflow: hidden; }
.cat-bar span { display: block; height: 100%; border-radius: inherit; background: var(--herb); }

@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .side-col { order: -1; }
}
@media (max-width: 860px) {
  .controls { width: 100%; justify-content: space-between; }
  .add, .cats, .day, .total { padding: 1rem; }
}
</style>
