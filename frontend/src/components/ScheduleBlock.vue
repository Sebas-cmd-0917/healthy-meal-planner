<script setup>
import { computed } from 'vue';
import { Briefcase, Dumbbell, UtensilsCrossed, CircleDot, Trash2 } from 'lucide-vue-next';
import { kindById, isNow } from '@/lib/kitchen';

const props = defineProps({
  block: { type: Object, required: true },
  recipeName: { type: String, default: '' },
  compact: { type: Boolean, default: false },
  removable: { type: Boolean, default: false },
});
defineEmits(['remove']);

const ICONS = { trabajo: Briefcase, gym: Dumbbell, comida: UtensilsCrossed, otro: CircleDot };
const kind = computed(() => kindById(props.block.kind));
const now = computed(() => isNow(props.block));

const fmtExercise = (e) => {
  const volume = e.sets && e.reps ? `${e.sets}×${e.reps}` : e.sets ? `${e.sets} series` : e.reps ? `${e.reps} reps` : '';
  return [e.name, volume, e.weightKg != null ? `${e.weightKg} kg` : ''].filter(Boolean).join(' · ');
};
</script>

<template>
  <article class="block" :class="[`m-${kind.magnet}`, { compact, now }]">
    <header class="block-head">
      <span class="block-icon" aria-hidden="true">
        <component :is="ICONS[block.kind]" :size="compact ? 14 : 16" :stroke-width="2" />
      </span>
      <p class="block-time num">
        <span class="visually-hidden">{{ kind.label }}, de </span>{{ block.start }}<span aria-hidden="true">–</span><span class="visually-hidden"> a </span>{{ block.end }}
      </p>
      <span v-if="now" class="now-pill">Ahora</span>
      <button
        v-if="removable"
        type="button"
        class="block-remove"
        :aria-label="`Quitar ${block.title} (${block.start})`"
        @click="$emit('remove', block)"
      >
        <Trash2 :size="15" aria-hidden="true" />
      </button>
    </header>

    <p class="block-title">{{ block.title }}</p>
    <p v-if="recipeName" class="block-sub">{{ recipeName }}</p>
    <p v-if="block.notes && !compact" class="block-sub">{{ block.notes }}</p>

    <ul v-if="block.exercises?.length" class="exercises">
      <li v-for="(e, i) in block.exercises" :key="i">{{ fmtExercise(e) }}</li>
    </ul>
  </article>
</template>

<style scoped>
.block {
  position: relative;
  display: grid; gap: 0.2rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-m);
  background: var(--bg);
  color: var(--fg);
  box-shadow: var(--shadow-magnet);
}
.block.compact { padding: 0.5rem 0.55rem; gap: 0.15rem; }

.block-head { display: flex; align-items: center; gap: 0.4rem; min-height: 22px; }
.block-icon {
  display: grid; place-items: center;
  width: 22px; height: 22px; flex: none;
  border-radius: 7px; background: var(--dot); color: #fff;
}
.compact .block-icon { width: 20px; height: 20px; border-radius: 6px; }
.block-time { font-size: 0.8rem; font-weight: 600; opacity: 0.85; white-space: nowrap; }

.now-pill {
  font-size: 0.7rem; font-weight: 700;
  padding: 0.05rem 0.45rem; border-radius: 999px;
  background: var(--ink); color: #fff;
}
.block.now { outline: 2px solid var(--dot); outline-offset: 1px; }

.block-remove {
  margin-left: auto;
  display: grid; place-items: center;
  width: 28px; height: 28px; margin-right: -0.3rem;
  border: 0; border-radius: 8px;
  background: transparent; color: inherit; cursor: pointer;
  opacity: 0.55;
  transition: opacity 120ms var(--ease-out), background-color 120ms var(--ease-out);
}
.block-remove:focus-visible { opacity: 1; }
/* En la vista semanal la columna es angosta: el botón flota en la esquina para no partir la hora */
.compact .block-remove { position: absolute; top: 0.3rem; right: 0.3rem; margin: 0; background: var(--bg); }
@media (hover: hover) and (pointer: fine) {
  .block-remove { opacity: 0; }
  .block:hover .block-remove { opacity: 0.6; }
  .block-remove:hover { opacity: 1; background: rgb(255 255 255 / 0.55); }
}

.block-title { font-family: var(--font-display); font-weight: 600; font-size: 1.02rem; line-height: 1.2; letter-spacing: -0.01em; overflow-wrap: anywhere; }
.compact .block-title { font-size: 0.9rem; }
.block-sub { font-size: 0.82rem; opacity: 0.85; overflow-wrap: anywhere; }

.exercises { margin: 0.2rem 0 0; padding: 0.35rem 0 0; list-style: none; border-top: 1px solid rgb(0 0 0 / 0.08); display: grid; gap: 0.1rem; }
.exercises li { font-size: 0.8rem; line-height: 1.3; overflow-wrap: anywhere; }
.compact .exercises li { font-size: 0.75rem; }
</style>
