import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import App from './App.vue';
import router from './router';
import './style.css';

createApp(App).use(createPinia()).use(router).mount('#app');
