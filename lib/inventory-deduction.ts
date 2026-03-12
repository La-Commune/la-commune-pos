/**
 * Auto-deducción de inventario al completar una orden.
 *
 * Flujo:
 * 1. Recibe los items de la orden (producto_id + cantidad)
 * 2. Para cada item, busca las recetas (ingredientes necesarios)
 * 3. Para cada receta, calcula cuánto descontar y crea un movimiento tipo "venta"
 * 4. Actualiza el stock_actual del ingrediente
 */

import { supabase, USE_MOCK } from "@/lib/supabase";
import type { ItemOrdenJSON } from "@/types/database";

interface DeductionResult {
  success: boolean;
  deducted: number; // cantidad de ingredientes deducidos
  errors: string[];
  lowStock: string[]; // ingredientes que quedaron bajo stock_minimo
}

/**
 * Deduce inventario basado en los items de una orden completada.
 * No bloquea el cobro — errores se logean pero no revierten el pago.
 */
export async function deducirInventarioPorOrden(
  items: ItemOrdenJSON[],
  ordenId: string,
  negocioId: string,
  usuarioId: string,
  folio?: string,
): Promise<DeductionResult> {
  if (USE_MOCK || !supabase) {
    if (process.env.NODE_ENV === "development") {
      console.log("[MOCK] Deducción de inventario para orden:", ordenId, items);
    }
    return { success: true, deducted: 0, errors: [], lowStock: [] };
  }

  const result: DeductionResult = {
    success: true,
    deducted: 0,
    errors: [],
    lowStock: [],
  };

  // Obtener todos los producto_ids de la orden
  const productoIds = items.map((i) => i.producto_id).filter(Boolean);
  if (productoIds.length === 0) return result;

  // Buscar todas las recetas de los productos de esta orden (un solo query)
  const { data: recetas, error: recetasError } = await supabase
    .from("recetas")
    .select("producto_id, inventario_id, cantidad")
    .in("producto_id", productoIds);

  if (recetasError) {
    result.errors.push(`Error al buscar recetas: ${recetasError.message}`);
    result.success = false;
    return result;
  }

  if (!recetas || recetas.length === 0) return result;

  // Obtener inventario actual de los ingredientes involucrados
  const inventarioIds = Array.from(new Set(recetas.map((r) => r.inventario_id)));
  const { data: inventarios, error: invError } = await supabase
    .from("inventario")
    .select("id, nombre, stock_actual, stock_minimo, unidad")
    .in("id", inventarioIds);

  if (invError || !inventarios) {
    result.errors.push(`Error al buscar inventario: ${invError?.message}`);
    result.success = false;
    return result;
  }

  // Crear mapa de inventario para acceso rápido
  const invMap = new Map(inventarios.map((i) => [i.id, i]));

  // Agrupar deducciones por ingrediente (un producto puede usar el mismo ingrediente varias veces)
  const deducciones = new Map<string, number>();

  for (const item of items) {
    const recetasDelProducto = recetas.filter((r) => r.producto_id === item.producto_id);
    for (const receta of recetasDelProducto) {
      const cantidadTotal = (receta.cantidad ?? 0) * item.cantidad;
      const prev = deducciones.get(receta.inventario_id) ?? 0;
      deducciones.set(receta.inventario_id, prev + cantidadTotal);
    }
  }

  // Ejecutar deducciones
  const referencia = folio ? `Venta — Orden #${folio}` : `Venta — Orden ${ordenId.slice(0, 8)}`;
  const deduccionEntries = Array.from(deducciones.entries());

  for (const [inventarioId, cantidadDeducir] of deduccionEntries) {
    const inv = invMap.get(inventarioId);
    if (!inv) {
      result.errors.push(`Ingrediente ${inventarioId} no encontrado`);
      continue;
    }

    const stockAnterior = Number(inv.stock_actual) || 0;
    const stockNuevo = Math.max(0, stockAnterior - cantidadDeducir);

    // Insertar movimiento de inventario
    const movData = {
      negocio_id: negocioId,
      inventario_id: inventarioId,
      tipo: "salida" as const,
      cantidad: -cantidadDeducir,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      orden_id: ordenId,
      referencia,
      usuario_id: usuarioId,
    };
    const { error: movError } = await supabase
      .from("movimientos_inventario")
      .insert(movData as never);

    if (movError) {
      result.errors.push(`Error movimiento ${inv.nombre}: ${movError.message}`);
      continue;
    }

    // Actualizar stock_actual
    const { error: updateError } = await supabase
      .from("inventario")
      .update({ stock_actual: stockNuevo })
      .eq("id", inventarioId);

    if (updateError) {
      result.errors.push(`Error actualizando stock ${inv.nombre}: ${updateError.message}`);
      continue;
    }

    result.deducted++;

    // Verificar si quedó bajo mínimo
    if (stockNuevo <= Number(inv.stock_minimo ?? 0)) {
      result.lowStock.push(inv.nombre);
    }
  }

  return result;
}
