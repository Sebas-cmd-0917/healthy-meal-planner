<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Check, Pencil, Plus, RotateCw, X } from 'lucide-vue-next';
import WeekNav from '@/components/WeekNav.vue';
import { useScheduleStore } from '@/stores/schedule';
import { dayKey, formatRest, parseDay } from '@/lib/kitchen';

const schedule = useScheduleStore();
const { blocks, weekStart, weekEnd, loading, error } = storeToRefs(schedule);

const fmtDay = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
const fmtRange = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const todayKey = dayKey(new Date());

const sessions = computed(() => blocks.value.filter((b) => b.kind === 'gym'));
const doneCount = computed(() => sessions.value.filter((s) => s.done).length);
const range = computed(() => `${fmtRange.format(weekStart.value)} – ${fmtRange.format(weekEnd.value)}`);
const isCurrentWeek = computed(() => dayKey(weekStart.value) <= todayKey && todayKey <= dayKey(weekEnd.value));
const dayLabel = (key) => {
  const label = fmtDay.format(parseDay(key));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// Edición de rutina: una sesión a la vez
const editing = ref(null);
const draft = reactive({ rows: [] });
const saving = ref(false);
const editError = ref('');
const actionError = ref('');

const emptyRow = () => ({ name: '', sets: '', reps: '', weightKg: '', rest: '' });
// "1:30" o "90" → 90 segundos
const parseRest = (value) => {
  const v = String(value ?? '').trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number(v);
};

function startEdit(session) {
  editError.value = '';
  editing.value = session.id;
  draft.rows = session.exercises.length
    ? session.exercises.map((e) => ({
      name: e.name, sets: e.sets ?? '', reps: e.reps ?? '', weightKg: e.weightKg ?? '', rest: formatRest(e.restSeconds),
    }))
    : [emptyRow()];
}

async function saveEdit(session) {
  editError.value = '';
  saving.value = true;
  try {
    const exercises = draft.rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name,
        sets: r.sets === '' ? null : Number(r.sets),
        reps: r.reps === '' ? null : String(r.reps),
        weightKg: r.weightKg === '' ? null : Number(r.weightKg),
        restSeconds: parseRest(r.rest),
      }));
    await schedule.update(session.id, { exercises });
    editing.value = null;
  } catch (e) {
    editError.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function toggle(session) {
  actionError.value = '';
  try {
    await schedule.toggleDone(session);
  } catch (e) {
    actionError.value = e.message;
  }
}

onMounted(() => schedule.loadWeek());
</script>

<template>
  <div class="page">
    <header class="head">
      <div class="page-head">
        <h1>Gym</h1>
        <p class="num">Semana del {{ range }} · {{ doneCount }} de {{ sessions.length }} {{ sessions.length === 1 ? 'sesión hecha' : 'sesiones hechas' }}</p>
      </div>
      <WeekNav
        :is-current="isCurrentWeek"
        @prev="schedule.shiftWeek(-1)"
        @next="schedule.shiftWeek(1)"
        @current="schedule.loadWeek(new Date())"
      />
    </header>

    <p v-if="actionError" class="notice notice-error" role="alert">{{ actionError }}</p>

    <div v-if="error" class="notice notice-error state">
      <p>{{ error }}</p>
      <button type="button" class="btn btn-quiet" @click="schedule.loadWeek()"><RotateCw :size="17" aria-hidden="true" /> Reintentar</button>
    </div>
    <p v-else-if="loading && !sessions.length" class="notice">Cargando…</p>
    <div v-else-if="!sessions.length" class="panel empty">
      <p>No hay sesiones de gym esta semana.</p>
      <RouterLink to="/plan" class="btn btn-primary">Agregar en el plan semanal</RouterLink>
    </div>

    <ol v-else class="sessions">
      <li v-for="s in sessions" :key="s.id" class="session panel" :class="{ done: s.done, today: s.date === todayKey }">
        <header class="session-head">
          <button
            type="button"
            class="check"
            :aria-pressed="s.done"
            :aria-label="`${s.done ? 'Marcar como no realizada' : 'Marcar como realizada'}: ${s.title}`"
            @click="toggle(s)"
          >
            <Check v-if="s.done" :size="18" :stroke-width="3" aria-hidden="true" />
          </button>
          <div class="session-title">
            <h2>{{ s.title }}</h2>
            <p class="num">{{ dayLabel(s.date) }} · {{ s.start }}–{{ s.end }}</p>
          </div>
          <button v-if="editing !== s.id" type="button" class="btn btn-quiet" @click="startEdit(s)">
            <Pencil :size="16" aria-hidden="true" /> {{ s.exercises.length ? 'Editar rutina' : 'Agregar rutina' }}
          </button>
        </header>

        <!-- Vista de la rutina -->
        <div v-if="editing !== s.id">
          <table v-if="s.exercises.length" class="routine">
            <thead>
              <tr><th scope="col">Ejercicio</th><th scope="col">Series × reps</th><th scope="col">Peso</th><th scope="col">Descanso</th></tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in s.exercises" :key="i">
                <th scope="row">{{ e.name }}</th>
                <td class="num">{{ e.sets ?? '—' }} × {{ e.reps ?? '—' }}</td>
                <td class="num">{{ e.weightKg != null ? `${e.weightKg} kg` : '—' }}</td>
                <td class="num">{{ e.restSeconds != null ? formatRest(e.restSeconds) : '—' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="notice">Sin rutina todavía.</p>
        </div>

        <!-- Edición de la rutina -->
        <form v-else class="editor" @submit.prevent="saveEdit(s)">
          <div class="editor-head" aria-hidden="true">
            <span>Ejercicio</span><span>Series</span><span>Reps</span><span>Peso (kg)</span><span>Descanso</span><span></span>
          </div>
          <div v-for="(row, i) in draft.rows" :key="i" class="editor-row">
            <input v-model="row.name" class="input" :aria-label="`Ejercicio ${i + 1}`" placeholder="Sentadilla" maxlength="60" />
            <input v-model="row.sets" class="input num" :aria-label="`Series del ejercicio ${i + 1}`" type="number" min="1" inputmode="numeric" placeholder="4" />
            <input v-model="row.reps" class="input num" :aria-label="`Repeticiones del ejercicio ${i + 1}`" placeholder="8-10" maxlength="12" />
            <input v-model="row.weightKg" class="input num" :aria-label="`Peso del ejercicio ${i + 1} en kg`" type="number" min="0" step="0.5" inputmode="decimal" placeholder="60" />
            <input v-model="row.rest" class="input num" :aria-label="`Descanso entre series del ejercicio ${i + 1} (m:ss)`" placeholder="1:30" pattern="\d{1,2}:\d{2}|\d+" />
            <button type="button" class="btn btn-quiet icon-btn" :aria-label="`Quitar ejercicio ${i + 1}`" @click="draft.rows.splice(i, 1)">
              <X :size="16" aria-hidden="true" />
            </button>
          </div>
          <div class="editor-actions">
            <button type="button" class="btn btn-quiet" @click="draft.rows.push(emptyRow())"><Plus :size="16" aria-hidden="true" /> Ejercicio</button>
            <p v-if="editError" class="notice notice-error" role="alert">{{ editError }}</p>
            <span class="spacer"></span>
            <button type="button" class="btn btn-quiet" @click="editing = null">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar rutina' }}</button>
          </div>
        </form>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
.state { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.empty { padding: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
.empty .btn { text-decoration: none; }

.sessions { margin: 0; padding: 0; list-style: none; display: grid; gap: 1rem; }
.session { padding: 1.25rem 1.5rem; display: grid; gap: 1rem; }
.session.today { border-color: var(--hoja-dot); }

.session-head { display: flex; align-items: center; gap: 0.9rem; }
.session-title { flex: 1; min-width: 0; }
.session-title h2 { font-size: 1.25rem; }
.session-title p { font-size: 0.88rem; color: var(--ink-faint); }
.session.done .session-title h2 { text-decoration: line-through; text-decoration-thickness: 2px; color: var(--ink-soft); }

.check {
  position: relative;
  display: grid; place-items: center; flex: none;
  width: 30px; height: 30px; padding: 0;
  border: 2px solid var(--hoja-dot); border-radius: 9px;
  background: var(--enamel-raised); color: #fff; cursor: pointer;
  transition: background-color 140ms var(--ease-out), transform 140ms var(--ease-out);
}
.check::after { content: ''; position: absolute; inset: -7px; }
.check:active { transform: scale(0.92); }
.check[aria-pressed='true'] { background: var(--hoja-dot); }

.routine { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
.routine th, .routine td { text-align: left; padding: 0.55rem 0.5rem; border-top: 1px solid var(--line); }
.routine thead th { border-top: 0; font-size: 0.78rem; font-weight: 600; color: var(--ink-faint); }
.routine tbody th { font-weight: 600; }
.routine td { color: var(--ink-soft); white-space: nowrap; }

.editor { display: grid; gap: 0.5rem; }
.editor-head, .editor-row { display: grid; grid-template-columns: minmax(0, 2.2fr) 0.7fr 0.8fr 0.9fr 0.9fr 44px; gap: 0.5rem; align-items: center; }
.editor-head { font-size: 0.78rem; font-weight: 600; color: var(--ink-faint); padding: 0 0.2rem; }
.icon-btn { padding: 0; width: 44px; }
.editor-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding-top: 0.25rem; }
.spacer { flex: 1; }
.editor-actions .btn:disabled { opacity: 0.6; }

@media (max-width: 720px) {
  .session { padding: 1rem; }
  .session-head { flex-wrap: wrap; }
  .session-head .btn { width: 100%; }
  .routine thead { display: none; }
  .routine tr { display: grid; grid-template-columns: 1fr auto; gap: 0.1rem 0.75rem; padding: 0.55rem 0; border-top: 1px solid var(--line); }
  .routine th, .routine td { border: 0; padding: 0; }
  .routine tbody th { grid-column: 1 / -1; }
  .routine td { font-size: 0.85rem; }
  .routine td:nth-of-type(2)::before { content: 'Peso '; color: var(--ink-faint); }
  .routine td:nth-of-type(3)::before { content: 'Descanso '; color: var(--ink-faint); }
  .editor-head { display: none; }
  .editor-row { grid-template-columns: 1fr 1fr 44px; padding-bottom: 0.6rem; border-bottom: 1px solid var(--line); }
  .editor-row > :first-child { grid-column: 1 / 3; }
  .editor-row > :last-child { grid-row: 1; grid-column: 3; }
  .editor-row > :nth-child(2), .editor-row > :nth-child(4) { grid-column: 1; }
  .editor-row > :nth-child(3), .editor-row > :nth-child(5) { grid-column: 2; }
}
</style>
