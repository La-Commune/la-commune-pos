# Guía de Setup — La Commune POS (Supabase)

## Estructura

```
supabase/
├── schemas/
│   └── schema.sql              ← Estructura completa (22 tablas, 9 enums, RLS, funciones)
├── seeds/
│   ├── 01-menu-completo.sql    ← Negocio + 8 categorías, 31 productos, tamaños, modificadores, 8 mesas
│   └── 02-usuario-admin.sql    ← Tu usuario David (admin, PIN 1234)
├── scripts/
│   └── reset-completo.sql      ← Resetear BD para empezar de cero
└── GUIA-SETUP.md               ← Este archivo
```

---

## Setup (BD nueva o reset)

En el **SQL Editor** de Supabase, ejecuta en este orden:

| Paso | Archivo | Qué hace |
|------|---------|----------|
| 0 | `scripts/reset-completo.sql` | Solo si ya tenías tablas — borra todo |
| 1 | `schemas/schema.sql` | Crea las 22 tablas, RLS, triggers, funciones |
| 2 | `seeds/01-menu-completo.sql` | Inserta negocio + menú completo + mesas |
| 3 | `seeds/02-usuario-admin.sql` | Inserta tu usuario admin |

---

## Variables de entorno

Crea `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-anon-key
```

Se encuentran en: **Settings > API** en el Dashboard de Supabase.

---

## Generar tipos TypeScript

```bash
npx supabase gen types typescript --project-id=TU-PROJECT-ID > types/database.ts
```

---

## Verificación

```sql
-- Debe mostrar 22 tablas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Debe mostrar conteos > 0
SELECT 'negocios' as tabla, count(*) FROM negocios
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
UNION ALL SELECT 'categorias', count(*) FROM categorias_menu
UNION ALL SELECT 'productos', count(*) FROM productos
UNION ALL SELECT 'mesas', count(*) FROM mesas;
```

---

## Habilitar Realtime (opcional)

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
ALTER PUBLICATION supabase_realtime ADD TABLE ordenes;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets_kds;
ALTER PUBLICATION supabase_realtime ADD TABLE pagos;
```

---

## Checklist

- [ ] `schemas/schema.sql` ejecutado
- [ ] `seeds/01-menu-completo.sql` ejecutado
- [ ] `seeds/02-usuario-admin.sql` ejecutado
- [ ] `.env.local` configurado
- [ ] `npm run dev` carga sin errores
- [ ] Login con PIN funciona
