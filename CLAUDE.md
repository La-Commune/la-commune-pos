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
- **Console.logs**: API routes usan `logger` de `lib/logger.ts`; client-side envueltos en `process.env.NODE_ENV === "development"` — 0 logs sensibles en producción
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

## Tests E2E (Playwright)

- `e2e/auth.spec.ts` — Login PIN pad, switch PIN/credenciales, validación email/password (5)
- `e2e/navigation.spec.ts` — Navegación a todos los módulos en mock mode (7)
- `e2e/orden-flow.spec.ts` — Catálogo, categorías, carrito, órdenes activas (6)
- `e2e/cobro-flow.spec.ts` — Selección orden, métodos pago, quick amounts, split, propina/descuento, verificación (10)
- `e2e/caja-flow.spec.ts` — Abrir turno, fondo inicial, quick amounts, diálogo confirmación, historial (7)
- `e2e/critical-path.spec.ts` — Flujo completo Dashboard→Caja→Órdenes→Cobros→Caja, sidebar (2)
- Total: 37 tests E2E
- Framework: Playwright (chromium)
- Modo: mock (sin Supabase) — el AuthProvider auto-logea como "David (Dev)" admin
- Comandos: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:headed`

## Auditoría de Seguridad (Marzo 2026) ✅

### PIN Login Fix ✅
- `login_por_pin()` necesitaba `GRANT EXECUTE` a `service_role` y `anon`
- Ejecutado directamente en Supabase y actualizado en `schema.sql` + `remove-anon-policies.sql`

### Admin Menu Fix ✅
- RLS policies de `productos` y `categorias_menu` para `anon` filtraban `disponible=true`/`activo=true` a nivel BD
- Eliminadas esas condiciones — ahora el filtrado es en JS (`getFullMenu({ forAdmin: true })` retorna todo)

### A1: API Routes sin autenticación ✅
- Creado `lib/api-auth.ts` — helper centralizado `verifyApiAuth(request, requiredRoles?)`
  - Extrae JWT del header Authorization, valida con `supabase.auth.getUser()`
  - Busca usuario en tabla `usuarios`, retorna `{ userId, rol, negocioId }`
  - Soporta filtro por roles (ej: `["admin"]`)
- Creado `lib/auth-fetch.ts` — wrapper client-side que inyecta Bearer token automáticamente
- Protegidos: `/api/auth/pin`, `/api/upload-logo`, `/api/usuarios`, `/api/sync`

### A2: Upload-logo sin validación de propiedad ✅
- `verifyApiAuth(req, ["admin"])` + ownership check (`negocioId !== auth.negocioId` → 403)
- Cache buster `?v=${Date.now()}` en URLs de Storage para evitar cache del navegador
- Custom event `"negocio-updated"` para refrescar logo/nombre en Sidebar sin reload
- `useNegocio()` escucha el evento y re-fetcha datos del negocio

### A3: Console.logs exponiendo datos sensibles ✅
- Creado `lib/logger.ts` — logger centralizado:
  - Dev: imprime todo (contexto + mensaje + datos)
  - Producción: solo `console.error(context, message)` sin datos sensibles
- API Routes (`/api/auth/pin`, `/api/upload-logo`, `/api/usuarios`) usan `logger`
- Client-side: todos los `console.log/warn/error` envueltos en `process.env.NODE_ENV === "development"`
- Archivos actualizados: `AuthProvider`, `ErrorBoundary`, `useSW`, `ordenes/page`, `inventory-deduction`, `supabase-admin`

### M1: Vista SECURITY DEFINER (`vista_productos_margen`) ✅
- La vista ejecutaba como `postgres` (owner), bypaseando RLS completamente
- Recreada con `security_invoker = true` → ahora respeta las políticas RLS del usuario que consulta
- Actualizado `supabase/schemas/schema.sql` + nuevo script `supabase/scripts/m1-fix-security-invoker.sql`

### M2: Funciones SECURITY DEFINER sin search_path fijo ✅
- 7 funciones ejecutaban como `postgres` pero usaban el `search_path` del caller → schema injection
- Fix: `ALTER FUNCTION ... SET search_path = public` en las 7 funciones
- Funciones: `get_mi_negocio_id`, `get_mi_rol`, `agregar_sello_a_tarjeta`, `_otorgar_bono_referido`, `deshacer_sello`, `canjear_tarjeta`, `swap_mesa_numeros`
- Ya tenían fix: `login_por_pin`, `limpiar_intentos_pin_viejos`
- Actualizado `schema.sql` + `migration-fidelidad-frontend.sql` + nuevo script `supabase/scripts/a3-fix-search-path.sql`

### SQL ejecutado en Supabase (19-Mar-2026):
- `GRANT EXECUTE ON FUNCTION login_por_pin(TEXT, TEXT) TO service_role, anon`
- RLS policies `anon` en `productos`/`categorias_menu`: eliminado filtro `disponible`/`activo`
- `CREATE OR REPLACE VIEW vista_productos_margen WITH (security_invoker = true)`
- `ALTER FUNCTION ... SET search_path = public` en 7 funciones SECURITY DEFINER

### Archivos nuevos de la auditoría:
- `lib/api-auth.ts` — verificación JWT server-side
- `lib/auth-fetch.ts` — fetch wrapper client-side con Bearer token
- `lib/logger.ts` — logger centralizado (dev vs producción)
- `supabase/scripts/m1-fix-security-invoker.sql` — script del fix M1
- `supabase/scripts/a3-fix-search-path.sql` — script del fix M2

## Pendiente

1. Crear iconos PWA reales (192x192 y 512x512) en `/public/icons/`
2. Eliminar dependencia `firebase` de package.json (legacy)
3. Tests E2E contra Supabase staging (auth real, flujo completo con persistencia)
