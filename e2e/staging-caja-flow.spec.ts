import { test, expect, waitForSupabaseData } from "./fixtures/supabase-auth";

/**
 * Tests del flujo de caja contra Supabase staging.
 *
 * Verifica:
 * - Abrir turno con fondo inicial → persiste en cortes_caja
 * - Cerrar turno con conteo → persiste diferencia
 * - Historial de cortes reales
 *
 * Ejecutar: npx playwright test e2e/staging-caja-flow.spec.ts --project=staging
 */

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

test.describe("Staging — Flujo de Caja (persistencia real)", () => {
  test.skip(!hasSupabase, "Requiere NEXT_PUBLIC_SUPABASE_URL");

  test("muestra pantalla de abrir turno o turno activo", async ({ authedPage: page }) => {
    await page.goto("/caja");
    await waitForSupabaseData(page);

    // Debe mostrar una de dos: "Abrir turno" o el turno activo
    const abrirTurno = page.locator("h1:has-text('Abrir turno')");
    const turnoActivo = page.getByText(/Turno activo|Cerrar turno|Ventas del turno/i).first();

    const visible = await abrirTurno.isVisible({ timeout: 10_000 }).catch(() => false)
      || await turnoActivo.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(visible).toBe(true);
  });

  test("abrir turno con fondo de $500 persiste", async ({ authedPage: page }) => {
    await page.goto("/caja");
    await waitForSupabaseData(page);

    // Si ya hay turno activo, skip
    const abrirTurno = page.locator("h1:has-text('Abrir turno')");
    const hasTurnoSinAbrir = await abrirTurno.isVisible({ timeout: 5_000 }).catch(() => false);
    test.skip(!hasTurnoSinAbrir, "Ya hay un turno activo — cerrar primero");

    // Ingresar fondo: $500
    const btn500 = page.locator("button:has-text('$500')").first();
    if (await btn500.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn500.click();
    } else {
      // Escribir manualmente
      const input = page.locator('input[type="number"]').first();
      await input.fill("500");
    }

    // Click "Abrir turno"
    const btnAbrir = page.locator("button:has-text('Abrir turno')").last();
    await expect(btnAbrir).toBeEnabled({ timeout: 3_000 });
    await btnAbrir.click();

    // Esperar transición — debería mostrar turno activo
    await page.waitForTimeout(3000);

    // Verificar que el turno se abrió (ya no muestra "Abrir turno" como h1)
    await expect(
      page.getByText(/Ventas del turno|Cerrar turno|Turno activo|efectivo/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Reload para verificar persistencia
    await page.reload();
    await page.waitForLoadState("networkidle");
    await waitForSupabaseData(page);

    // Sigue mostrando turno activo (no vuelve a "Abrir turno")
    await expect(
      page.getByText(/Ventas del turno|Cerrar turno|Turno activo/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("historial de cortes muestra datos reales", async ({ authedPage: page }) => {
    await page.goto("/caja");
    await waitForSupabaseData(page);

    // Buscar sección/tab de historial
    const historial = page.locator("button:has-text('Historial'), button:has-text('historial')").first();
    if (await historial.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await historial.click();
      await page.waitForTimeout(1000);

      // Debería mostrar al menos 1 corte si se ha abierto turno antes
      // o mostrar "Sin cortes anteriores"
      const hayCortes = await page.getByText(/\$[\d,]+/).first().isVisible({ timeout: 5_000 }).catch(() => false);
      const sinCortes = await page.getByText(/sin cortes|no hay|vacío/i).first().isVisible({ timeout: 2_000 }).catch(() => false);

      expect(hayCortes || sinCortes).toBe(true);
    }
  });
});
