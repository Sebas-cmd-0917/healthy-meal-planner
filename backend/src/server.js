import { env } from './infrastructure/config/env.js';
import { buildContainer } from './infrastructure/container.js';
import { createApp } from './app.js';

const app = createApp({ env, container: buildContainer(env) });

app.listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port}/api (persistencia: ${env.persistence})`);
});
