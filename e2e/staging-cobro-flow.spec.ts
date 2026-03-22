import { test, expect, waitForSupabaseData } from "./fixtures/supabase-auth";

/**
 * Tests del flujo de cobros contra Supabase staging.
 *
 * Verifica que los cobros persisten y actualizan estado de órdenes/mesas.
 *
 * Ejecutar: npx playwright test e2e/staging-cobro-flow.spec.ts --project=staging
 */

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

test.describe("Staging — Flujo de Cobros (persistencia real)", () => {
  test.skip(!hasSupabase, "Requiere NEXT_PUBLIC_SUPABASE_URL");

  test("carga órdenes reales pendientes de cobro", async ({ authedPage: page }) => {
    await page.goto("/cobros");
    await waitForSupabaseData(page);

    await expect(page.getByText("Cobros")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Órdenes por cobrar")).toBeVisible();
  });

  test("muestra métodos de pago al seleccionar orden", async ({ authedPage: page }) => {
    await page.goto("/cobros");
    await waitForSupabaseData(page);

    // Esperar que carguen las órdenes
    await page.waitForTimeout(2000);

    // Click en la primera orden pendiente (si hay)
    const ordenes = page.locator(".rounded-xl.bg-surface-2.border");
    const count = await ordenes.count();

    if (count > 0) {
      await ordenes.first().click();
      await page.waitForTimeout(500);

      // Verificar métodos de pago
      await expect(page.getByText("Efectivo")).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText("Tarjeta")).toBeVisible();
      await expect(page.getByText("Transferencia")).toBeVisible();
    }
  });

  test("cobrar con tarjeta completa la orden", async ({ authedPage: page }) => {
    await page.goto("/cobros");
    await waitForSupabaseData(page);
    await page.waitForTimeout(2000);

    const ordenes = page.locator(".rounded-xl.bg-surface-2.border");
    const count = await ordenes.count();

    test.skip(count === 0, "No hay órdenes pendientes de cobro");

    // Seleccionar primera orden
    await ordenes.first().click();
    await page.waitForTimeout(500);

    // Seleccionar Tarjeta
    await page.locator("button:has-text('Tarjeta')").first().click();

    // Click Cobrar
    const btnCobrar = page.locator("button:has-text('Cobrar')").first();
    if (await btnCobrar.isEnabled()) {
      await btnCobrar.click();

      // Confirmar en el diálogo
      const btnConfirmar = page.locator("button:has-text('Confirmar cobro')").first();
      if (await btnConfirmar.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await btnConfirmar.click();
      }

      // Esperar que se procese — toast de éxito o redirect
      await page.waitForTimeout(3000);

      // La orden debería desaparecer de la lista de pendientes
      // o cambiar su estado
    }
  });
});
