# June · Empieza

PWA para ayudar a June a **empezar** a estudiar, concentrarse y recoger.
Next.js (App Router, export estático) + TypeScript + Tailwind CSS v4. Sin backend: los datos viven en el
dispositivo (`localStorage`) detrás de una capa de almacenamiento (`src/lib/storage.ts`) lista para cambiar a Supabase.

## Comandos

```bash
npm install
npm run dev        # desarrollo
npm run build      # export estático en out/ + precache del service worker
npm run lint
npm run typecheck
```

## Estructura

- `src/lib/` lógica: desatascador (`breakdown.ts`), planificador hacia atrás (`planner.ts`), rachas con comodín
  (`streak.ts`), sonidos Web Audio (`sound.ts`), confeti, avisos (`notify.ts`) y estado (`store.tsx`).
- `src/components/` pantallas (Hoy, Estudiar, Orden, Progreso), modo foco, onboarding, ajustes y Blu, el mono.
- `public/sw.js` service worker (offline + manejador push preparado para v2). `scripts/postbuild.mjs` le inyecta
  la lista de archivos a precachear.
- `public/manifest.json` e iconos en `public/icons/`.

## Notificaciones

- Con la app abierta: avisos locales (`src/components/useReminders.ts`).
- Con la app cerrada: push. El móvil calcula sus próximos avisos (`src/lib/schedule.ts`) y los manda a
  `api/push/sync`, que los guarda en Supabase (proyecto `june-avisos`; web en https://blu-june.vercel.app). Cada minuto `pg_cron` llama a
  `api/push/send`, que envía los que tocan con web-push. Esquema en `supabase/migrations/`.
- Vercel solo necesita `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` (públicas). Las claves VAPID y el secreto
  del cron viven en `private.config` de Supabase y nunca salen de ahí salvo hacia la función de envío.
- En iPhone los avisos solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4+).
