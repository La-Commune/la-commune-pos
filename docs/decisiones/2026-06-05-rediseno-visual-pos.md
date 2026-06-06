# Decisiones — Rediseño visual del POS (trabajo nocturno autónomo) · 2026-06-05

> Generado por grill-me. Entrada para el prompt nocturno de Claude Code y para write-a-prd futuro.
> Contexto: David ama el POS funcionalmente pero visualmente se siente "raro, barato". El doc previo
> `PROPUESTAS-DISENO.html` (raíz de La Commune) es un manifiesto de dirección abstracto, NO pantallas concretas.

## Decisiones tomadas

- **Objetivo:** lograr UNA dirección visual fuerte que a David le encante. Los 7 temas actuales fueron un parche porque el diseño base no gustaba — si la dirección funciona, los temas sobran (repensar después).
- **Entregable:** 2 direcciones nuevas + mockups de pantallas concretas aplicando cada una (no más manifiestos abstractos).
- **Las 2 direcciones a explorar:**
  1. Cálido artesanal refinado (marca café/local/barrio) + disciplina de minimal premium para que NO sea rústico-barato.
  2. Oscuro premium (pantalla todo el día, lee caro) + acentos audaces con confianza.
- **Pantallas hero (mockups):** Cobros, Dashboard, Mesas, Órdenes/Menú. Libertad para rediseñar las demás si alcanza. Cambiar diseño NO debe romper funcionalidad.
- **Formato de entrega:** mockups HTML estáticos (NO tocan el código del POS) + UNA pantalla implementada en código como PoC: **Dashboard** (bajo riesgo, display de KPIs, primera impresión).
- **PoC en código:** en branch nueva off main, NUNCA push, NUNCA tocar main/development/production. Funcionalidad intacta.
- **Foco de la noche:** diseño primero; si termina, mejoras seguras menores (lint/tests) en branch nocturna aparte, sin push (como el nocturno del 3-jun).
- **Vara de calidad:** criterio awwwards + el blog de David como referencia de SU nivel (NO copiar el estilo editorial del blog al POS). Nota: su skill awwwards-design parece estancada, no depender solo de ella.

## Anti-patrones a evitar (los "tells" de IA que se ven baratos — restricción dura)

- La línea de acento a la izquierda de los cards (delata IA). Prohibida.
- El acento ámbar/amarillo `#C49A3C` del tema `neo-minimal-warm` (default actual). Alejarse de él.
- Navbar genérico. Rediseñarlo con carácter.
- Transiciones NO homologadas entre pantallas. Definir UN lenguaje de movimiento consistente.
- Sombras de plantilla, bordes redondeados tipo bootstrap, gradientes morado/azul genéricos, emojis como iconos.
- En general: que NO parezca hecho con IA. Ese es el termómetro de "barato".

## Preguntas abiertas

- Cuál de las 2 direcciones gana — depende de: David, al ver los mockups.
- Si se colapsa el sistema de 7 temas a 1-2 — depende de: dirección elegida, decisión posterior.
- Implementación completa del rediseño (más allá de la PoC del Dashboard) — depende de: aprobación de dirección, luego cadena write-a-prd → prd-to-issues → tdd.
