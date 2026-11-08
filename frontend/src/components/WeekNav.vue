<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

defineProps({
  isCurrent: { type: Boolean, default: false },
  currentLabel: { type: String, default: 'Esta semana' },
  prevLabel: { type: String, default: 'Semana anterior' },
  nextLabel: { type: String, default: 'Semana siguiente' },
});
defineEmits(['prev', 'next', 'current']);
</script>

<template>
  <nav class="week-nav" aria-label="Cambiar de periodo">
    <button type="button" class="btn btn-quiet icon-btn" :aria-label="prevLabel" @click="$emit('prev')">
      <ChevronLeft :size="18" aria-hidden="true" />
    </button>
    <button type="button" class="btn btn-quiet" :disabled="isCurrent" @click="$emit('current')">{{ currentLabel }}</button>
    <button type="button" class="btn btn-quiet icon-btn" :aria-label="nextLabel" @click="$emit('next')">
      <ChevronRight :size="18" aria-hidden="true" />
    </button>
  </nav>
</template>

<style scoped>
.week-nav { display: flex; gap: 0.4rem; }
.icon-btn { padding: 0; width: 44px; }
.btn:disabled { opacity: 0.5; }
</style>
