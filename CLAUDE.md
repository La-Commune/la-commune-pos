# La Commune POS — Sistema de Punto de Venta

POS web PWA offline-first para el café/restaurante La Commune (Mineral de la Reforma, MX).
Proyecto separado de `la-commune-frontend` (app de fidelidad), pero comparten datos via Firebase.

## Stack

- **Next.js 14** — App Router, `"use client"` explícito requerido
- **Supabase** (PostgreSQL) — BD principal del POS, Auth, Realtime, RLS
- **Firebase SDK** — Solo lectura, datos de fidelidad (customers, cards, promotions)
- **Zustand** — Estado por módulo (auth, mesas, ordenes, kds, ui, sync)
- **Dexie** (IndexedDB) — Cola offline para acciones pendientes
- **Zod** — Validación compartida client + server
- **Tailwind CSS** + **Radix UI** + **Framer Motion**
- **TypeScript**

## Design System

Monochrome Warm v3. Sin dorado, tonos tierra cálidos.
- Fonts: DM Serif Display (display), DM Sans (UI)
- Surfaces: #0C0B09 → #2D2C26
- Text: #EDE8DF (100) → #3F3B35 (25)
- Accent: #A89680 (stone)
- Border radius: 8/12/16px
- Ver `globals.css` para todas las CSS variables

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # linter
```

## Estructura de rutas

```
app/(auth)/login/        — Login de staff (Supabase Auth)
app/(pos)/               — App principal (protegida)
  mesas/                 — Grid de mesas con estados
  ordenes/               — Carrito + selector de productos
  menu/                  — CRUD de productos
  kds/                   — Kitchen Display System
  cobros/                — Pagos
  reportes/              — Analytics
  usuarios/              — Staff management
  fidelidad/             — Puente Firebase
app/api/sync/            — Endpoint de sync offline
```

## Stores (Zustand)

- `store/auth.store.ts` — Usuario autenticado, rol
- `store/mesas.store.ts` — Lista de mesas, mesa seleccionada
- `store/ordenes.store.ts` — Órdenes activas, carrito
- `store/ui.store.ts` — Sidebar, módulo activo
- `store/sync.store.ts` — Estado de conexión, acciones pendientes

## Cola offline

`lib/offline-queue.ts` — IndexedDB via Dexie.
Acciones se encolan cuando no hay conexión y se sincronizan vía `/api/sync`.

## Convenciones

- **Divisa**: MXN — usar `formatMXN()` de `lib/utils.ts`
- **Idioma**: UI en español
- **Enums**: definidos en `lib/validators.ts` como Zod enums
- **CSS vars**: en `globals.css`, mapeadas a Tailwind en `tailwind.config.ts`
