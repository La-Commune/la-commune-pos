# Decisiones de Diseño — Rediseño Shell V3
**Fecha:** 9 de junio de 2026  
**Sesión:** grill-me con David  
**Scope:** La Commune POS — nueva dirección visual y de layout

---

## Decisiones resueltas

### 1. Navegación principal
**Opción B — Dock compacto (104px) con popover "Más"**
- 4–5 items primarios visibles siempre en el dock (Inicio, Mesas, Órdenes, KDS, Cobros)
- Items secundarios (Menú, Fidelidad, Caja, Usuarios, Inventario, Configuración) en popover al tocar "Más" abajo del dock
- Defaults iniciales: los más comunes del día a día. Ajustar según uso real posterior.

### 2. Acción primaria — "Nueva orden"
**Split-dock-item: comportamiento dual**
- Cuerpo del botón (tap principal) → navega a `/ordenes`
- Esquina "+" (tap secundario) → crea nueva orden directamente
- Animación: spring-bounce en hover, transición premium en ambas acciones
- Justificación: el barista necesita VER las órdenes existentes y también CREAR una nueva — no compiten si el destino del tap es diferente.

### 3. Espacio vacío (chimuelo)
**Combinar stretch + widget "Resumen del día"**
- Cards se estiran para llenar la altura disponible
- Cuando las órdenes activas son pocas, muestran historial reciente
- Widget fijo al fondo del dashboard: ticket más alto del día, hora pico, producto más vendido
- Base UX: progressive disclosure — los datos siempre están ahí, nunca hay huecos

### 4. Paleta de colores
**P2 · Verde Vivo**

| Token | Light | Dark |
|-------|-------|------|
| Fondo | `#F5F3EE` | `#111010` |
| Superficie | `#FFFFFF` | `#1A1717` |
| Tinta | `#1A1511` | `#EDE8DF` |
| Acento | `#0B7A50` | `#1FD988` |
| CTA dock (gradiente) | `#0B7A50 → #129B64` | `#1FD988 → #0EC96E` |
| Acento soft | `#DFF2E8` | `#162A20` |

Diferencia clave vs P1 (baseline): verde más saturado, gradiente en el botón de "Nueva orden" elimina la sensación de plano.

### 5. Layout de shell en ≥1024px (tablet landscape + desktop)
**Sin rail izquierdo. Solo dock derecho expandible.**

| Breakpoint | Layout |
|------------|--------|
| < 640 | topbar + main + actionbar inferior |
| 640–1023 | topbar + main + actionbar (portrait tablet) |
| ≥ 1024 | **main + dock derecho** (sin rail izquierdo) |

**Comportamiento del dock (≥1024):**
- Estado colapsado: 72px — solo iconos
- Expansión: hover en desktop, tap en tablet → 200px con iconos + labels
- Modo de expansión: **overlay** (el dock flota sobre el main, el contenido no se mueve)
- Trigger de colapso: mouse leave en desktop, tap fuera en tablet
- Nav items van en la parte superior del dock expandido
- Acciones contextuales (cobrar, imprimir, etc.) en la parte inferior

### 6. Tipografía
**T1 — sin cambio**
- UI: Schibsted Grotesk (400/600/700/800)
- Mono (dinero, folios, tiempo): IBM Plex Mono (400/500/600/700)
- Justificación: no se percibe diferencia real en uso operativo. Cambio sin beneficio claro.

### 7. Modo de color por defecto
**Sistema (`prefers-color-scheme`)**
- El POS detecta el modo del dispositivo al iniciar
- Día si el iPad/desktop está en modo claro
- Noche si está en oscuro
- El usuario puede forzar override desde configuración

---

## Siguiente paso sugerido

Con estas decisiones completas, el flujo natural es:

1. **write-a-prd** — documentar el rediseño como PRD formal con módulos y criterios de aceptación
2. **prd-to-issues** — convertir en issues de implementación ordenados por dependencia
3. Implementar pantalla por pantalla partiendo del shell y dashboard (ya tienen PoC en branches `diseno-v3-light` / `diseno-v3-dark`)

---

## Contexto de branches existentes

| Branch | Contenido |
|--------|-----------|
| `diseno-v3-light` | ShellV3 + Dashboard con tokens V3 light |
| `diseno-v3-dark` | Mismo, tokens dark |
| `diseno-poc-v2-light` / `diseno-poc-v2-dark` | Dirección V2 Linear (descartada) |
| `nocturno-2026-06-06` | Lint 0 errores + 18 tests nuevos → mergeado |

Los mockups HTML de referencia están en `propuestas-pos/v3-*.html`.
