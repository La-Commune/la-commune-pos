# La Commune — Punto de Venta

Sistema POS interno para el café **La Commune** (Mineral de la Reforma, Hidalgo, MX).

**Creado por [⬡ David San Luis Aguirre](https://davidsanluisaguirre.com/)**

---

## Stack

| Tecnología | Versión | Rol |
|---|---|---|
| [Next.js](https://nextjs.org/) | 14 | Framework — App Router |
| [React](https://react.dev/) | 18 | UI |
| [TypeScript](https://www.typescriptlang.org/) | latest | Tipado |
| [Supabase](https://supabase.com/) | — | Base de datos, Auth, Realtime |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5 | Estado global (auth, mesas, órdenes, UI, sync, zonas) |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Estilos |
| [Recharts](https://recharts.org/) | 3 | Gráficas de reportes |
| [Dexie](https://dexie.org/) | 4 | Cola offline (IndexedDB) |
| [Zod](https://zod.dev/) | 4 | Validación de datos |
| [Framer Motion](https://www.framer-motion.com/) | 12 | Animaciones |
| [Netlify](https://www.netlify.com/) | — | Hosting / Despliegue |

---

## Módulos

| Módulo | Estado | Realtime |
|---|---|---|
| Dashboard | Conectado — KPIs del día, alertas, accesos rápidos | pagos, ordenes |
| Layout (Sidebar + Navbar) | Completo — permisos por rol, redirect por rol | — |
| Login | Completo — Supabase Auth (email/password + PIN bcrypt) | — |
| Mesas | Conectado — CRUD, drag & drop, resize, rotación, zonas, context menu, timers, swap | mesas |
| Menú / CRUD | Conectado — CRUD completo, toggle disponible, categorías, grid/list, filtros | productos, categorias_menu |
| Órdenes | Conectado — crear/confirmar/cancelar, vincular mesa, folio auto | ordenes, mesas |
| KDS (Cocina) | Conectado — iniciar/marcar lista/regresar, join ordenes→mesas, notificaciones sonoras | tickets_kds, ordenes |
| Cobros | Conectado — pagos simple/split, orden→completada, liberar mesa, folio | ordenes, mesas |
| Reportes | Conectado — KPIs, ventas por día/hora (Recharts), top productos, métodos pago | pagos |
| Usuarios | Conectado — CRUD Auth+tabla, PIN bcrypt, roles, búsqueda/filtro | usuarios |
| Fidelidad | Conectado — CRUD clientes, puntos/niveles, canjear recompensas, push notifications | clientes |
| Caja (Corte) | Conectado — abrir/cerrar turno, conteo efectivo, diferencia, historial | pagos, ordenes |

---

## Estructura de rutas

```
app/(pos)/
  page.tsx          — Dashboard
  login/            — Login (PIN pad + credenciales)
  mesas/            — Mapa de mesas (drag & drop)
  menu/             — CRUD de productos y categorías
  ordenes/          — Gestión de órdenes
  kds/              — Kitchen Display System
  cobros/           — Cobro simple y split
  reportes/         — KPIs y gráficas
  usuarios/         — CRUD de usuarios
  fidelidad/        — Programa de puntos, niveles y push notifications
  caja/             — Corte de caja
  configuracion/    — Temas, layout, preferencias
```

---

## Setup local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd la-commune-pos
npm install
```

### 2. Variables de entorno

Copia `.env.example` y crea `.env.local`:

```bash
cp .env.example .env.local
```

Variables requeridas:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secreta — para API routes) |
| `PIN_PASSWORD_SECRET` | HMAC secret para passwords determinísticos de PIN |
| `NEXT_PUBLIC_NEGOCIO_ID` | UUID del negocio en tabla `negocios` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key para Web Push |
| `VAPID_PRIVATE_KEY` | VAPID private key (secreta) |

> Sin variables de Supabase, la app entra en **mock mode** automáticamente con datos de prueba.

### 3. Base de datos

```bash
# Ejecutar schema (29 tablas, 10 enums, RLS, funciones)
psql <supabase-db-url> -f supabase/schemas/schema.sql

# Seeds: menú completo + usuario admin
psql <supabase-db-url> -f supabase/seeds/01-menu-completo.sql
psql <supabase-db-url> -f supabase/seeds/02-usuario-admin.sql
```

### 4. Iniciar servidor

```bash
npm run dev
```

El servidor arranca en `http://localhost:3001`.

---

## Auth

Dos métodos de login:

- **Email/password**: `signInWithPassword()` directo con Supabase Auth.
- **PIN numérico**: Frontend envía PIN a `POST /api/auth/pin` → service role valida con bcrypt (`pin_hash`) → sesión Auth real con password determinístico (HMAC-SHA256).

`RouteGuard` protege rutas por rol y redirige si no hay acceso. Roles: admin, barista, camarero.

### Seguridad

- PIN hasheado con bcrypt en BD (columna `pin_hash`, texto plano eliminado)
- API routes protegidas con JWT (`lib/api-auth.ts` + `lib/auth-fetch.ts`)
- 7 funciones SECURITY DEFINER con `SET search_path = public`
- 6 funciones INVOKER con `SET search_path = public`
- Logger centralizado (`lib/logger.ts`) — en producción solo errores sin datos sensibles
- 0 `as any` en producción, 0 console.logs sin protección

---

## Push Notifications

Envío de notificaciones Web Push a clientes desde el módulo Fidelidad:

| Funcionalidad | Descripción |
|---|---|
| Notificar a todos | Botón con badge de dispositivos activos |
| Notificar individual | Por cliente, con plantillas predefinidas |
| Indicador estado | 🔔 en lista de clientes con # dispositivos |

Las notificaciones se envían vía Edge Functions de Supabase (`send-push`, `push-trigger`).

---

## Base de datos

### Esquema

| Recurso | Cantidad |
|---|---|
| Tablas | 29 |
| Enums | 10 |
| Funciones | 19 |
| Triggers | 25 |
| RLS Policies | 97 |
| Índices | 120 |
| Realtime | 15 tablas habilitadas |

Archivos en `supabase/`:
- `schemas/schema.sql` — Schema completo
- `seeds/01-menu-completo.sql` — 8 categorías, 31 productos, 9 tamaños, 10 modificadores, 8 mesas
- `seeds/02-usuario-admin.sql` — Usuario admin inicial
- `scripts/` — Reset, grants, realtime, swap, push notifications setup

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3001) |
| `npm run dev:clean` | Dev con limpieza de cache `.next` |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor Next.js |
| `npm run lint` | ESLint |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E mock (Playwright) |
| `npm run test:e2e:ui` | E2E con UI interactiva |
| `npm run test:e2e:headed` | E2E con browser visible |
| `npm run test:e2e:staging` | E2E contra Supabase real |
| `npm run test:e2e:staging:headed` | Staging con browser visible |

---

## Tests

### Unitarios (Vitest — 59 tests)

- `lib/__tests__/utils.test.ts` — formatMXN, formatTime, cn
- `lib/__tests__/helpers.test.ts` — getInitials, formatOrigen, tiempoTranscurrido, timerColor, etc.
- `hooks/__tests__/useIVA.test.ts` — calcularIVA, desglose fiscal, descuentos, propinas

### E2E mock (Playwright — 37 tests)

- `e2e/auth.spec.ts` — Login PIN pad, switch PIN/credenciales
- `e2e/navigation.spec.ts` — Navegación a todos los módulos
- `e2e/orden-flow.spec.ts` — Catálogo, carrito, órdenes activas
- `e2e/cobro-flow.spec.ts` — Métodos pago, split, verificación
- `e2e/caja-flow.spec.ts` — Abrir/cerrar turno, historial
- `e2e/critical-path.spec.ts` — Flujo completo mesa→orden→cobro→caja

### E2E staging (Playwright — 12 tests)

- Auth real contra Supabase, orden, cobro, caja
- Requiere `NEXT_PUBLIC_SUPABASE_URL` + `TEST_USER_PIN` en `.env.local`
- Fixture: `e2e/fixtures/supabase-auth.ts`

---

## Type Safety

- Tipos generados desde Supabase en `types/database.ts` — 29 tablas, enums, funciones, aliases
- Tipos joined: `OrdenWithMesa`, `PagoWithOrden`, `TicketKDSWithJoin`
- Validators con Zod (`lib/validators.ts`)
- 0 `as any` en producción, 2 `@ts-expect-error` legítimos en `useSupabase.ts`

---

## Arquitectura

### Stores (Zustand)
- `auth` — sesión, usuario, rol
- `mesas` — estado de mesas, zonas
- `ordenes` — órdenes activas, items
- `ui` — tema, sidebar, densidad, modals
- `sync` — estado de sincronización
- `zonas` — zonas del restaurante

### Hooks principales
- `useSupabase` — cliente Supabase con realtime
- `useIVA` — cálculos fiscales (IVA 16% incluido)
- `useSearch` / `useDebounce` — búsqueda con debounce
- `useTiempoTranscurrido` — timers de mesas/órdenes
- `useKDSNotifications` — sonidos del KDS

### Offline
- Cola offline con Dexie (`lib/offline-queue.ts`)
- Mock data con fallback automático (`lib/mock-data.ts`)

### Componentes reutilizables
Modal, Toast, EmptyState, ErrorBoundary, PageError, LoadingSpinner, ConfirmDialog, Input/Select/Textarea, Badge

---

## Design System

5 temas switcheables via `next-themes` (`data-theme` attribute):

| Tema | ID | Accent |
|---|---|---|
| Neo-Minimal Warm | `neo-minimal-warm` | #C49A3C amber |
| Sci-Fi Gradient | `sci-fi-gradient` | #00D4F5 cyan |
| Soft Neumorphism | `soft-neumorphism` | #8E8EAA lavanda |
| Glass Layered | `glass-layered` | #3B82F6 azul |
| Mono Editorial | `mono-editorial` | #8B1A1A rojo |

Layout personalizable: sidebar (left/mini/top/hidden), densidad (spacious/comfortable/compact), ancho paneles (narrow/default/wide). Todo en CSS custom properties + Zustand persist.

---

## CI/CD

GitHub Actions corre en cada push/PR a `develop` y `production`:

1. **TypeCheck** — `tsc --noEmit`
2. **Unit Tests** — Vitest
3. **E2E Tests** — Playwright

Netlify despliega automáticamente al mergear.

---

## Despliegue en Netlify

| Sitio | URL | Entorno |
|---|---|---|
| `lacommuneposdevelopment` | `lacommuneposdevelopment.netlify.app` | Desarrollo |
| (Pendiente) | — | Producción |

Variables de entorno requeridas en Netlify:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PIN_PASSWORD_SECRET
NEXT_PUBLIC_NEGOCIO_ID
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

---

## PWA

- Service Worker v2 con cache por capas
- Manifest con shortcuts a módulos principales
- Funciona offline con cola de sincronización (Dexie)

---

## Licencia

© 2026 La Commune. Todos los derechos reservados. Código propietario — no licenciado para reutilización, distribución o modificación sin permiso explícito.
