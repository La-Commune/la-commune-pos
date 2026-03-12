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
| [Zustand](https://zustand-demo.pmnd.rs/) | — | Estado global (auth, mesas, órdenes, UI, sync, zonas) |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Estilos |
| [Recharts](https://recharts.org/) | — | Gráficas de reportes |
| [Dexie](https://dexie.org/) | — | Cola offline (IndexedDB) |
| [Zod](https://zod.dev/) | — | Validación de datos |
| [Netlify](https://www.netlify.com/) | — | Hosting / Despliegue |

---

## Módulos

| Módulo | Estado | Realtime |
|---|---|---|
| Dashboard | Conectado — KPIs del día, alertas, accesos rápidos | pagos, ordenes |
| Layout (Sidebar + Navbar) | Completo — permisos por rol, redirect por rol | — |
| Login | Completo — Supabase Auth (email/password + PIN) | — |
| Mesas | Conectado — CRUD, drag & drop, resize, rotación, zonas | mesas |
| Menú / CRUD | Conectado — CRUD completo, toggle disponible, categorías | productos, categorias_menu |
| Órdenes | Conectado — crear/confirmar/cancelar, vincular mesa, folio auto | ordenes, mesas |
| KDS (Cocina) | Conectado — iniciar/marcar lista/regresar, notificaciones sonoras | tickets_kds, ordenes |
| Cobros | Conectado — pagos simple/split, liberar mesa, folio | ordenes, mesas |
| Reportes | Conectado — KPIs, ventas por día/hora, top productos | pagos |
| Usuarios | Conectado — CRUD Auth+tabla, PIN, roles, búsqueda/filtro | usuarios |
| Fidelidad | Conectado — CRUD clientes, puntos/niveles, canjear recompensas | clientes |
| Caja (Corte) | Conectado — abrir/cerrar turno, conteo efectivo, historial | pagos, ordenes |

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
  fidelidad/        — Programa de puntos y niveles
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

Crea `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=<tu-url-de-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
PIN_PASSWORD_SECRET=<secreto-para-auth-por-pin>
NEXT_PUBLIC_NEGOCIO_ID=<uuid-del-negocio>
```

> Sin variables de Supabase, la app entra en **mock mode** automáticamente con datos de prueba.

### 3. Base de datos

```bash
# Ejecutar schema (22 tablas, enums, RLS, funciones)
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
- **PIN numérico**: Frontend envía PIN a `POST /api/auth/pin` → service role valida → sesión Auth real con password determinístico (HMAC-SHA256).

`RouteGuard` protege rutas por rol y redirige si no hay acceso.

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3001) |
| `npm run build` | Build de producción |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright) |

---

## Tests

### Unitarios (Vitest — 59 tests)

- `lib/__tests__/utils.test.ts` — formatMXN, formatTime, cn
- `lib/__tests__/helpers.test.ts` — getInitials, formatOrigen, tiempoTranscurrido, timerColor, etc.
- `hooks/__tests__/useIVA.test.ts` — calcularIVA, desglose fiscal, descuentos, propinas

### E2E (Playwright — 37 tests, mock mode)

- `e2e/auth.spec.ts` — Login PIN pad, switch PIN/credenciales
- `e2e/navigation.spec.ts` — Navegación a todos los módulos
- `e2e/orden-flow.spec.ts` — Catálogo, carrito, órdenes activas
- `e2e/cobro-flow.spec.ts` — Métodos pago, split, verificación
- `e2e/caja-flow.spec.ts` — Abrir/cerrar turno, historial
- `e2e/critical-path.spec.ts` — Flujo completo

---

## CI/CD

GitHub Actions corre en cada push/PR a `develop` y `production`:

1. **TypeCheck** — `tsc --noEmit`
2. **Unit Tests** — Vitest
3. **E2E Tests** — Playwright (solo en `develop` y `production`, no en `main`)

Netlify despliega automáticamente al mergear.

---

## Design System

5 temas switcheables via `next-themes`:

| Tema | Accent |
|---|---|
| Neo-Minimal Warm | amber |
| Sci-Fi Gradient | cyan |
| Soft Neumorphism | lavanda |
| Glass Layered | azul |
| Mono Editorial | rojo |

Layout personalizable: sidebar (left/mini/top/hidden), densidad, ancho de paneles.

---

## Licencia

© 2026 La Commune. Todos los derechos reservados. Código propietario — no licenciado para reutilización, distribución o modificación sin permiso explícito.
