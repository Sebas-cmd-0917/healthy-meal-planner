# Healthy Meal Planner

Planificador de comidas saludables: recetas, plan semanal y generación de listas/planes.

- **frontend/**: Vue 3 + Vite + Vue Router + Pinia
- **backend/**: Node.js + Express 5, arquitectura hexagonal
- **supabase/migrations/**: SQL de la base de datos (Supabase, plan gratuito)
- Automatizaciones: n8n local vía webhooks

## Requisitos
Node.js 20.19+ o 22.12+

## Arranque local
```bash
# Backend
cd backend
cp .env.example .env      # PERSISTENCE=memory funciona sin base de datos
npm install
npm run dev               # http://localhost:3000/api/health
npm test

# Frontend (otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Supabase
1. Crear proyecto en supabase.com.
2. SQL Editor → ejecutar `supabase/migrations/0001_init.sql`.
3. En `backend/.env`: `PERSISTENCE=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (la llave `sb_secret_...`).

La secret key solo vive en el backend. RLS está activo y sin políticas públicas.

## Arquitectura del backend
```
src/
  domain/            Entidades y reglas de negocio (sin dependencias externas)
  application/
    ports/           Contratos que necesita la app (RecipeRepository, AutomationGateway)
    use-cases/       Casos de uso (ListRecipes, CreateRecipe)
  infrastructure/
    adapters/        Implementaciones de los puertos (Supabase, memoria, n8n)
    http/            Express: rutas, controladores, middlewares (adaptador de entrada)
    config/env.js    Variables de entorno
    container.js     Composition root: conecta puertos con adaptadores
  app.js             Crea la app de Express (sin listen)
  server.js          Levanta el servidor
```
Regla: `domain` no importa nada de afuera; `application` solo importa `domain`;
`infrastructure` es la única capa que conoce Express, Supabase o n8n.

Para agregar un módulo nuevo (ej. `meal-plan`): entidad en `domain/`, puerto(s) en
`application/ports/`, casos de uso en `application/use-cases/`, adaptador en
`infrastructure/adapters/`, rutas en `infrastructure/http/` y registrarlo en `container.js`.

## n8n
El backend publica eventos (ej. `recipe.created`) como `POST {N8N_WEBHOOK_BASE_URL}/recipe-created`.
Si `N8N_WEBHOOK_SECRET` está definido se envía en el header `X-Webhook-Secret`.
Si n8n no responde, la operación no falla.

## Despliegue
- Frontend: Vercel (root directory `frontend/`, `vercel.json` ya maneja las rutas del SPA).
- Backend: túnel (Cloudflare Tunnel / ngrok) desde local, o contenedor (`backend/Dockerfile`) en Cloud Run.
