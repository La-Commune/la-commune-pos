# La Commune POS — Sistema de Punto de Venta

POS web PWA offline-first para el café/restaurante La Commune (Mineral de la Reforma, MX).
Proyecto separado de `la-commune-frontend` (app de fidelidad), comparten datos via Supabase.

## Seguridad — Regla absoluta

**NUNCA incluir credenciales, tokens, keys, secrets, PINs, passwords, emails reales ni UUIDs de usuarios en:**
- Código fuente, comentarios o strings hardcodeados
- Archivos SQL (seeds, migrations, scripts)
- Ejemplos, snippets o documentación dentro del repo
- Commits, PR descriptions o mensajes de log

Usar siempre placeholders genéricos (`REPLACE_WITH_...`, `admin@example.com`, `000000`).
Las credenciales reales van **exclusivamente** en `.env.local` (que está en `.gitignore`).

## Stack

- **Next.js 14** — App Router, `"use client"` explícito requerido
- **Supabase** (PostgreSQL) — BD principal del POS, Auth, Realtime, RLS
- **Zustand** — Estado por módulo (auth, mesas, ordenes, kds, ui, sync, zonas)
- **Dexie** (IndexedDB) — Cola offline para acciones pendientes
- **Zod** — Validación compartida client + server
- **Tailwind CSS** + **Radix UI** + **Framer Motion**
- **TypeScript** — tipos generados con `supabase gen types`
- **Vitest** + **happy-dom** — tests unitarios

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # linter
npm test         # correr tests (vitest)
npm run test:watch    # tests en modo watch
npm run test:coverage # tests con cobertura
```

## Estructura de rutas

```
app/(auth)/login/        — Login de staff (Supabase Auth)
app/(pos)/               — App principal (protegida)
  page.tsx               — Dashboard (KPIs del día, alertas, accesos rápidos)
  mesas/                 — Grid de mesas con estados + plano interactivo
  ordenes/               — Carrito + selector de productos
  menu/                  — CRUD de productos y categorías
  kds/                   — Kitchen Display System
  cobros/                — Pagos (simple + split)
  reportes/              — Analytics (Recharts)
  usuarios/              — Staff management
  fidelidad/             — Clientes, puntos, niveles
  caja/                  — Cortes de caja
app/api/sync/            — Endpoint de sync offline
app/api/auth/pin/        — Login por PIN → sesión Auth real (service role)
app/api/usuarios/        — CRUD usuarios (POST crear, PATCH editar)
```

## Stores (Zustand)

- `store/auth.store.ts` — Usuario autenticado, rol, login/logout/checkSession
- `store/mesas.store.ts` — Lista de mesas, CRUD optimistic
- `store/ordenes.store.ts` — Órdenes activas, carrito
- `store/ui.store.ts` — Sidebar, tema, densidad, paneles (persist en localStorage)
- `store/sync.store.ts` — Estado de conexión, acciones pendientes
- `store/zonas.store.ts` — Zonas del restaurante

## Auth

Dos métodos de login, ambos crean sesión Auth real en Supabase:

- **Email/password**: `signInWithPassword()` directo desde el cliente
- **PIN (4 dígitos)**: Frontend → `POST /api/auth/pin` → service role valida PIN + genera sesión → frontend hace `setSession()` con los tokens

El endpoint PIN usa `SUPABASE_SERVICE_ROLE_KEY` (server-side only) y un password determinístico derivado via HMAC-SHA256 con `PIN_PASSWORD_SECRET` que se sincroniza automáticamente.

Archivos clave: `app/api/auth/pin/route.ts`, `lib/supabase-admin.ts`, `store/auth.store.ts`

Políticas anon con `USING(true)` fueron eliminadas. Solo `authenticated` puede acceder a tablas (filtrado por `negocio_id` via RLS).

## Type Safety

- Tipos generados desde Supabase en `types/database.ts` con `npx supabase gen types`
- Tipos joined para queries con relaciones:
  - `OrdenWithMesa` — orden + mesa.numero via join
  - `PagoWithOrden` — pago + orden.descuento via join
  - `TicketKDSWithJoin` — ticket + orden.folio/estado/origen + mesa.numero
- `ProductoContextMenu` importa `Producto` de `types/database` (no interfaz local)
- 2 `@ts-expect-error` legítimos en `useSupabase.ts` para `insert()` genérico

## Realtime

Todos los módulos conectados tienen suscripciones Realtime via `subscribeToTable()`:

| Módulo | Tablas suscritas |
|--------|-----------------|
| Dashboard | pagos, ordenes |
| Mesas | mesas |
| Menú | productos, categorias_menu |
| Órdenes | ordenes, mesas |
| KDS | tickets_kds, ordenes |
| Cobros | ordenes, mesas |
| Caja | pagos, ordenes |
| Reportes | pagos |
| Usuarios | usuarios |
| Fidelidad | clientes |

## Tests (Vitest)

- `lib/__tests__/utils.test.ts` — formatMXN, formatTime, cn (7 tests)
- `lib/__tests__/helpers.test.ts` — getInitials, formatOrigen, tiempoTranscurrido, timerColor, esUrgente, getNivelConfig, etc. (25 tests)
- `hooks/__tests__/useIVA.test.ts` — calcularIVA, desglose fiscal, descuentos, propinas, cobro completo (16 tests)
- Total: 59 tests, todos pasando

## Cola offline

`lib/offline-queue.ts` — IndexedDB via Dexie.
Acciones se encolan cuando no hay conexión y se sincronizan vía `/api/sync`.

## Convenciones

- **Divisa**: MXN — usar `formatMXN()` de `lib/utils.ts`
- **IVA incluido en precios**: `precio_base` ya incluye 16% IVA. Desglose: `base = total / 1.16`, `iva = total - base`
- **Idioma**: UI en español
- **Enums**: definidos en `lib/validators.ts` como Zod enums
- **CSS vars**: en `globals.css`, mapeadas a Tailwind en `tailwind.config.ts`
- **Console.logs**: envueltos en `process.env.NODE_ENV === "development"` — no loguear en producción
- **Componentes**: `"use client"` explícito requerido

## Variables de entorno

Ver `.env.example`. Variables requeridas:
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only)
- `NEXT_PUBLIC_NEGOCIO_ID` — UUID del negocio
- `PIN_PASSWORD_SECRET` — Secret HMAC para passwords determinísticos de PIN

## Supabase — Datos Compartidos con Frontend

Ambos proyectos (POS y frontend de fidelidad) comparten la misma instancia de Supabase.

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

## Pendiente

1. Crear iconos PWA reales (192x192 y 512x512) en `/public/icons/`
2. Tests de integración y E2E
3. Eliminar dependencia `firebase` de package.json (legacy)
