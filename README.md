# Healthy Meal Planner

Planificador de comidas saludables: recetas, plan semanal y generación de listas/planes.

- **frontend/**: Vue 3 + Vite + Vue Router + Pinia, en TypeScript
- **backend/**: Node.js + Express 5 en TypeScript, arquitectura hexagonal
- **supabase/migrations/**: SQL de la base de datos (Supabase, plan gratuito)
- Automatizaciones: n8n local vía webhooks

## Requisitos
Node.js 20.19+ o 22.12+ y pnpm 12 (`npm install -g pnpm@12.18.0`).
Cada carpeta tiene su `pnpm-workspace.yaml` con la configuración de seguridad de dependencias.

## Arranque local
```bash
# Backend
cd backend
cp .env.example .env      # PERSISTENCE=memory funciona sin base de datos
pnpm install
pnpm dev                  # http://localhost:3000/api/health (tsx, recarga al guardar)
pnpm test                 # tests con node:test
pnpm typecheck            # revisa tipos sin compilar
pnpm build && pnpm start  # compila a dist/ y corre el JavaScript resultante

# Frontend (otra terminal)
cd frontend
cp .env.example .env
pnpm install
pnpm dev                  # http://localhost:5174
pnpm typecheck            # vue-tsc: tipos de .ts y .vue
pnpm build                # typecheck + build de producción
```

## Supabase
1. Crear proyecto en supabase.com.
2. SQL Editor → ejecutar en orden `0001_init.sql`, `0002_schedule.sql` y `0003_tasks_expenses.sql` (carpeta `supabase/migrations/`).
3. En `backend/.env`: `PERSISTENCE=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (la llave `sb_secret_...`).

La secret key solo vive en el backend. RLS está activo y sin políticas públicas.

## Arquitectura del backend
```
src/
  domain/            Entidades y reglas de negocio (sin dependencias externas)
  application/
    ports/           Interfaces que necesita la app (repositorios, AutomationGateway)
    use-cases/       Casos de uso (crear bloques, listar gastos, ...)
  infrastructure/
    adapters/        Implementaciones de los puertos (Supabase, memoria, n8n)
    http/            Express: rutas y middlewares (adaptador de entrada)
    config/env.ts    Variables de entorno, validadas al arrancar
    container.ts     Composition root: conecta puertos con adaptadores
  app.ts             Crea la app de Express (sin listen)
  server.ts          Levanta el servidor
```
TypeScript en modo estricto (`noUncheckedIndexedAccess` incluido). Las entidades reciben
datos `unknown` y los validan en su constructor: el tipo garantiza la forma, la validación garantiza los valores.
Los tipos que ve el frontend están en `frontend/src/types/api.ts`.
Regla: `domain` no importa nada de afuera; `application` solo importa `domain`;
`infrastructure` es la única capa que conoce Express, Supabase o n8n.

Para agregar un módulo nuevo (ej. `meal-plan`): entidad en `domain/`, puerto(s) en
`application/ports/`, casos de uso en `application/use-cases/`, adaptador en
`infrastructure/adapters/`, rutas en `infrastructure/http/` y registrarlo en `container.ts`.

## API de la agenda semanal
| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/schedule?from=AAAA-MM-DD&to=AAAA-MM-DD` | Bloques del rango (máx. 31 días) |
| POST | `/api/schedule` | Crea uno o varios bloques: `{ "blocks": [...] }`. Si uno es inválido, no se guarda ninguno |
| PATCH | `/api/schedule/:id` | Actualiza campos de un bloque |
| DELETE | `/api/schedule/:id` | Quita un bloque |

Un bloque: `{ date, start, end, kind: trabajo|gym|comida|otro, title, notes, recipeId?, exercises?, done }`.
Los de gym llevan su rutina: `exercises: [{ name, sets, reps, weightKg, restSeconds, notes }]`.

## API de tareas y gastos
Mismo contrato para `/api/tasks` y `/api/expenses`:
`GET ?from&to` → `{ items, summary }` · `POST` uno, una lista o `{ tasks|expenses: [...] }` · `PATCH /:id` · `DELETE /:id`.

- Tarea: `{ date, title, notes, done }`. El resumen trae total, hechas y pendientes.
- Gasto (COP, sin decimales): `{ date, amount, category, note }`. Categorías: comida, mercado, transporte, hogar, servicios, salud, entretenimiento, compras, otros. El resumen trae total, cantidad, totales por categoría y por día. Rango máximo: 92 días.

## n8n
El backend publica eventos (ej. `recipe.created`) como `POST {N8N_WEBHOOK_BASE_URL}/recipe-created`.
Si `N8N_WEBHOOK_SECRET` está definido se envía en el header `X-Webhook-Secret`.
Si n8n no responde, la operación no falla.

## Despliegue
- Frontend: Vercel (root directory `frontend/`, `vercel.json` ya maneja las rutas del SPA).
- Backend: túnel (Cloudflare Tunnel / ngrok) desde local, o contenedor (`backend/Dockerfile`) en Cloud Run.
