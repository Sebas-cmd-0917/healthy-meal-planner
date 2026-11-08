<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Sun, CalendarDays, Dumbbell, ListChecks, Wallet, BookOpen } from 'lucide-vue-next';
import BrandMark from '@/components/BrandMark.vue';
import { api } from '@/services/api';

const nav = [
  { to: '/', label: 'Hoy', icon: Sun },
  { to: '/plan', label: 'Plan semanal', short: 'Plan', icon: CalendarDays },
  { to: '/gym', label: 'Gym', icon: Dumbbell },
  { to: '/tareas', label: 'Tareas', icon: ListChecks },
  { to: '/gastos', label: 'Gastos', icon: Wallet },
  { to: '/recetas', label: 'Recetas', icon: BookOpen },
];

/** null mientras se comprueba */
const apiOnline = ref<boolean | null>(null);

onMounted(async () => {
  try {
    const { status } = await api.health();
    apiOnline.value = status === 'ok';
  } catch {
    apiOnline.value = false;
  }
});
</script>

<template>
  <div class="shell">
    <aside class="rail" aria-label="Navegación principal">
      <RouterLink to="/" class="brand">
        <BrandMark />
        <span>Healthy Meal<br />Planner</span>
      </RouterLink>

      <nav class="rail-nav">
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="rail-link">
          <component :is="item.icon" :size="20" :stroke-width="1.9" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <p class="api-status" :data-state="apiOnline === null ? 'checking' : apiOnline ? 'on' : 'off'" role="status">
        <span class="api-dot" aria-hidden="true"></span>
        {{ apiOnline === null ? 'Conectando…' : apiOnline ? 'Servidor conectado' : 'Servidor sin conexión' }}
      </p>
    </aside>

    <header class="topbar">
      <RouterLink to="/" class="brand">
        <BrandMark />
        <span>Healthy Meal Planner</span>
      </RouterLink>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <nav class="tabbar" aria-label="Navegación principal">
      <RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="tab">
        <component :is="item.icon" :size="22" :stroke-width="1.9" aria-hidden="true" />
        <span>{{ item.short ?? item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  background: linear-gradient(to right, var(--mint) 247px, var(--mint-deep) 247px 248px, var(--enamel) 248px);
}

.rail {
  position: sticky; top: 0; height: 100dvh;
  display: flex; flex-direction: column; gap: 2rem;
  padding: 1.5rem 1rem;
  background: var(--mint);
}

.brand {
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0 0.5rem;
  font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--ink); text-decoration: none;
}

.rail-nav { display: grid; gap: 0.25rem; }

.rail-link {
  display: flex; align-items: center; gap: 0.75rem;
  min-height: 44px; padding: 0 0.75rem;
  border-radius: var(--radius-s);
  color: var(--mint-ink); font-weight: 600; text-decoration: none;
  transition: background-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out);
}
.rail-link.router-link-exact-active {
  background: var(--enamel-raised); color: var(--ink);
  box-shadow: var(--shadow-raised);
}
@media (hover: hover) and (pointer: fine) {
  .rail-link:not(.router-link-exact-active):hover { background: rgb(255 255 255 / 0.5); }
}

.api-status {
  margin-top: auto;
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0 0.75rem;
  font-size: 0.82rem; color: var(--mint-ink);
}
.api-dot { width: 8px; height: 8px; border-radius: 50%; background: #8aa598; }
[data-state='on'] .api-dot { background: var(--hoja-dot); }
[data-state='off'] .api-dot { background: var(--tomate-dot); }

.main {
  width: 100%; max-width: 1180px;
  padding: 2.5rem clamp(1.25rem, 3vw, 3rem) 4rem;
}

.topbar, .tabbar { display: none; }

@media (max-width: 860px) {
  .shell { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 1fr; background: var(--enamel); }
  .rail { display: none; }

  .topbar {
    display: flex; align-items: center;
    padding: 0.85rem 1.25rem;
    background: var(--mint);
    border-bottom: 1px solid var(--mint-deep);
  }

  .main { padding: 1.5rem 1.25rem calc(5.5rem + env(safe-area-inset-bottom)); }

  .tabbar {
    position: fixed; inset: auto 0 0 0; z-index: 10;
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.15rem;
    padding: 0.35rem 0.35rem calc(0.35rem + env(safe-area-inset-bottom));
    background: var(--mint);
    border-top: 1px solid var(--mint-deep);
  }
  .tab {
    display: grid; justify-items: center; gap: 0.15rem;
    min-height: 52px; padding-top: 0.35rem;
    border-radius: var(--radius-s);
    font-size: 0.7rem; font-weight: 600; color: var(--mint-ink); text-decoration: none;
  }
  .tab.router-link-exact-active { background: var(--enamel-raised); color: var(--ink); box-shadow: var(--shadow-raised); }
}
</style>
