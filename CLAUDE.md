# La Commune POS — Sistema de Punto de Venta

POS web PWA offline-first para el café/restaurante La Commune (Mineral de la Reforma, MX).
Proyecto separado de `la-commune-frontend` (app de fidelidad), pero comparten datos via Firebase.

## Stack

- **Next.js 14** — App Router, `"use client"` explícito requerido
- **Supabase** (PostgreSQL) — BD principal del POS, Auth, Realtime, RLS
- **Firebase SDK** — Solo lectura, datos de fidelidad (legacy, migración a Supabase en progreso)
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
app/api/auth/pin/        — Login por PIN → sesión Auth real (service role)
```

## Stores (Zustand)

- `store/auth.store.ts` — Usuario autenticado, rol
- `store/mesas.store.ts` — Lista de mesas, mesa seleccionada
- `store/ordenes.store.ts` — Órdenes activas, carrito
- `store/ui.store.ts` — Sidebar, módulo activo
- `store/sync.store.ts` — Estado de conexión, acciones pendientes

## Auth

Dos métodos de login, ambos crean sesión Auth real en Supabase:

- **Email/password**: `signInWithPassword()` directo desde el cliente
- **PIN (4 dígitos)**: Frontend → `POST /api/auth/pin` → service role valida PIN + genera sesión → frontend hace `setSession()` con los tokens

El endpoint PIN usa `SUPABASE_SERVICE_ROLE_KEY` (server-side only) y un password determinístico (`lc_pos_{auth_uid}`) que se sincroniza automáticamente.

Archivos clave: `app/api/auth/pin/route.ts`, `lib/supabase-admin.ts`, `store/auth.store.ts`

Políticas anon con `USING(true)` fueron eliminadas. Solo `authenticated` puede acceder a tablas (filtrado por `negocio_id` via RLS).

## Cola offline

`lib/offline-queue.ts` — IndexedDB via Dexie.
Acciones se encolan cuando no hay conexión y se sincronizan vía `/api/sync`.

## Convenciones

- **Divisa**: MXN — usar `formatMXN()` de `lib/utils.ts`
- **IVA incluido en precios**: `precio_base` ya incluye 16% IVA. Desglose: `base = total / 1.16`, `iva = total - base`
- **Idioma**: UI en español
- **Enums**: definidos en `lib/validators.ts` como Zod enums
- **CSS vars**: en `globals.css`, mapeadas a Tailwind en `tailwind.config.ts`

## Supabase — Datos Compartidos con Frontend

Ambos proyectos (POS y frontend de fidelidad) comparten la misma instancia de Supabase:
- **URL**: ver `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
- **Negocio ID**: ver `NEXT_PUBLIC_NEGOCIO_ID` en `.env.local`
- **Connection string**: ver Supabase Dashboard → Settings → Database (NO commitear credenciales)

### Tablas compartidas (fuente de verdad única):
- `productos` — menú completo (precio_base, disponible, visible_menu, ingredientes, etiquetas, etc.)
- `categorias_menu` — categorías del menú (nombre, descripcion, tipo, activo)
- `opciones_tamano` — tamaños por producto (nombre, precio_adicional, orden)
- `clientes` — clientes de fidelidad
- `usuarios` — staff (POS usa Auth, frontend usa login_por_pin() via service_role)
- `tarjetas`, `eventos_sello`, `recompensas` — sistema de sellos de fidelidad
- `promociones` — promos activas

### Columnas clave en `productos`:
- `disponible BOOLEAN` — disponibilidad temporal ("se acabó hoy")
- `visible_menu BOOLEAN DEFAULT TRUE` — visibilidad permanente en menú público
- `eliminado_en TIMESTAMPTZ` — soft delete
- `precio_base NUMERIC NOT NULL` — precio incluye IVA
- Tamaños en tabla separada `opciones_tamano` con `precio_adicional`

### Auth compartido:
- POS: Auth directo (email/password + PIN → sesión Auth real)
- Frontend: anon key + login_por_pin() via service_role para admin panel
- Roles: admin, barista, camarero, cocina — definidos en enum `rol_usuario`

## Estado del Proyecto (Marzo 2026)

### Módulos conectados a Supabase:
Dashboard, Login, Mesas, Menú/CRUD, Órdenes, KDS, Cobros, Reportes, Usuarios, Fidelidad, Caja

### Pendiente:
1. Generar tipos: `npx supabase gen types typescript --project-id=ntfmubmmykpzbltbeujv > types/database.ts`
2. Reemplazar `as any` en stores y hooks por tipos generados
3. Crear iconos PWA reales (192x192 y 512x512) en `/public/icons/`
4. Tests end-to-end
