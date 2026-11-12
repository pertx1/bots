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

v1 usa recordatorios locales con la app abierta (y notificaciones del sistema si la PWA está instalada en iOS 16.4+).
Para push con la app cerrada (v2) falta un backend que guarde suscripciones y envíe con claves VAPID; ver
`subscribeToPush` en `src/lib/notify.ts` y el evento `push` en `public/sw.js`.
