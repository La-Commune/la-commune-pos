# Decisiones — Rediseño POS: pivote a dirección moderna premium · 2026-06-06

> Generado por grill-me. Reemplaza/actualiza 2026-06-05-rediseno-visual-pos.md (las 2 direcciones de ahí fueron rechazadas).
> Entrada para el loop de día de Claude Code y para write-a-prd futuro.

## Contexto del pivote
David revisó la PoC del Dashboard (dirección "Origen", commit 1f383be en branch diseno-dashboard-poc de la-commune-pos). Veredicto:
- LE GUSTA: las animaciones y que se sientan homologadas (esto se conserva).
- NO le gusta: tipografía, colores, formas. Sigue leyéndose como "proyecto de escuela hecho con IA".
- Quiere: que se vea MODERNO, como un PRODUCTO PREMIUM que vendes.
Conclusión: las 2 direcciones previas (Origen cálido artesanal / Brasa oscuro) fallaron el blanco. Aclaración técnica: la PoC SÍ se creó bien en la-commune-pos; la confusión fue de directorio (David la buscó desde el repo raíz, que es un repo git separado).

## Decisiones tomadas
- **Dirección nueva única: "Linear-grade / producto premium"** (estética techno-precisa 2026, à la Linear/Vercel/Stripe/Ramp). Investigación web confirmó que es lo opuesto a "proyecto escuela IA" y distinto de la editorial (el blog, ya descartada).
  - Tipografía: sans moderna y precisa (Geist/Inter o grotesk con carácter), contraste fuerte de pesos, tracking ajustado. CERO serif cálida.
  - Color: base casi monocromática (neutros reales, capas de gris/casi-negro) + UN acento confiado con disciplina. Nada de ámbar/amarillo ni gradientes morado/azul.
  - Formas: radios chicos consistentes (6-10px, no todo pill), bordes hairline 1px, layout bento, tira de 4-6 KPIs.
  - Profundidad: sutil — separa por tono y hairlines, no por sombras de plantilla.
  - Espaciado: sistemático (grid 4/8px), que respire, sidebar 240-280px.
  - Movimiento: conservar lo homologado (lo único que le gustó), refinar a micro-interacciones nivel Linear.
- **Light Y dark, ambas como PoC** — el POS opera de día, pero quiere juzgar ambas vivas.
- **Orden del loop (revisión incremental para poder corregir dirección):** (1) mockup del Dashboard en la dirección nueva → PoC del Dashboard; (2) mock + PoC de la BARRA DE NAVEGACIÓN (no le convence, petición explícita); (3) seguir con re-mockups del resto de pantallas, incrementalmente, para que David revise antes y cambie rumbo si algo no le gusta.
- **Anti-patrones de IA (restricción dura):** sin línea de acento a la izquierda de cards, sin emojis como iconos, sin sombras/bordes de plantilla, sin gradientes genéricos.
- **Logística:** modelo Sonnet (no Opus) + effort medium (no xhigh) — para diseño generativo es el punto dulce, ~8× más barato y más rápido. Sandbox ya configurado (contención + auto-aprobar). Mockups = archivos en La Commune/propuestas-pos/. PoCs = branches en la-commune-pos (scoped con CSS Module + next/font, cero impacto en los 7 temas). Checkpoints incrementales en RESUMEN.

## Pivote 2 (6-jun, tarde) — tablet-nativo + carácter
La dirección V2 "Linear-grade" quedó GENÉRICA/peor que Origen según David (3ra dirección que no aterriza: Origen barato, Brasa no, V2 genérico). Dos problemas a la par: (1) NO es tablet-nativo (se diseñó desktop-first; el POS se usa en tablet) y (2) le falta CARÁCTER (se ve como cualquier dashboard).

Decisión: una sola dirección NUEVA en todas las pantallas (decisión de David, aunque ha fallado 3x — por eso el loop hace Dashboard + 2-3 hero PRIMERO con checkpoint prominente para poder redirigir si David revisa a media tarde antes de propagar a 13).

### Brief tablet-nativo (research web 6-jun)
- **Landscape primario** (POS = trabajo por tareas, ambas manos). Soportar: tablet landscape (~1024-1366, primario), tablet portrait (~768-820, layout distinto), teléfono (~390, una columna), desktop (grande fijo).
- Touch targets mínimo 44-48px, separación ≥8px. Dos columnas en tablet, una en teléfono. Aprovechar espacio sin saturar. Considerar alcance de mano derecha para acciones primarias.
- Definir sistema responsive explícito (breakpoints + grid) — sirve para cualquier estilo.

### Brief de CARÁCTER (anti-genérico — la falla repetida)
- Genérico = sin firma. Darle UN movimiento de firma confiado: un acento usado con valentía (no gris+azul tímido), un tratamiento tipográfico fuerte, o una firma de layout propia.
- Premium-con-personalidad (refs: Arc "espacio para respirar", Mercury, Things, Linear): restraint + 1 firma + tipo/espaciado impecables. NO decorar, NO ser genérico.
- Identidad café de La Commune inyectada de forma CONTROLADA (un solo acento cálido o un pairing tipográfico distintivo) para que sea "el POS de La Commune", no "cualquier dashboard" — sin caer en el rústico de Origen.
- Conservar el movimiento homologado (lo único que siempre le ha gustado).

### Logística pivote 2
- Branches nuevas para esta dirección (no tocar las v2): p.ej. diseno-v3-light / diseno-v3-dark.
- Referencias traídas por el coach (loop SIN web). Modelo Sonnet + effort high. Mockups en propuestas-pos/v3-*, PoCs en la-commune-pos.

## Preguntas abiertas
- Cuál gana (light vs dark, y si la dirección nueva por fin le late) — depende de: David, al ver los PoCs vivos.
- Tras aprobar dirección → implementación completa vía write-a-prd → prd-to-issues → tdd.
