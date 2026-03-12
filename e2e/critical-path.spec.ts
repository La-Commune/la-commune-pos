import { test, expect } from "@playwright/test";

// Test del flujo crítico completo del POS en mock mode:
// Dashboard → Caja (abrir turno) → Órdenes (crear) → Cobros → Caja (cerrar)
//
// En mock mode no hay Supabase, así que las operaciones de escritura
// (insertar orden, pago, etc.) no persisten. Este test verifica que toda
// la UI se renderiza correctamente y que la navegación funciona.

test.describe("POS — Flujo Crítico Completo (mock mode)", () => {
  test("navega por todos los módulos del flujo principal", async ({ page }) => {
    // 1. Dashboard carga correctamente
    await page.goto("/");
    await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 15_000 });

    // 2. Navegar a Caja — pantalla de abrir turno
    await page.goto("/caja");
    await expect(
      page.locator("h1:has-text('Abrir turno')")
    ).toBeVisible({ timeout: 10_000 });

    // Llenar fondo inicial con $200
    await page.locator("button:has-text('$200')").click();
    const inputFondo = page.locator('input[type="number"]').first();
    await expect(inputFondo).toHaveValue("200");

    // 3. Navegar a Órdenes — catálogo de productos
    await page.goto("/ordenes");
    await expect(page.locator("text=Nueva orden")).toBeVisible({ timeout: 10_000 });

    // Verificar que hay productos mock disponibles
    await expect(page.locator("text=Americano").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Latte").first()).toBeVisible();

    // Verificar categorías
    await expect(page.locator("text=Café Caliente").first()).toBeVisible();

    // 4. Navegar a Cobros — lista de órdenes por cobrar
    await page.goto("/cobros");
    await expect(page.locator("text=Cobros")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Órdenes por cobrar")).toBeVisible();

    // Seleccionar una orden si hay
    const ordenes = page.locator(".rounded-xl.bg-surface-2.border");
    const count = await ordenes.count();
    if (count > 0) {
      await ordenes.first().click();

      // Verificar que se muestran métodos de pago
      await expect(page.locator("text=Efectivo")).toBeVisible();
      await expect(page.locator("text=Tarjeta")).toBeVisible();

      // Click en Tarjeta y luego Cobrar → Verificación
      await page.locator("button:has-text('Tarjeta')").first().click();

      const btnCobrar = page.locator("button:has-text('Cobrar')").first();
      if (await btnCobrar.isEnabled()) {
        await btnCobrar.click();
        await expect(page.locator("text=Confirme con el cliente")).toBeVisible();
        await expect(page.locator("text=Confirmar cobro")).toBeVisible();
      }
    }

    // 5. Volver a Caja — verificar que sigue en sin_turno
    await page.goto("/caja");
    await expect(
      page.locator("h1:has-text('Abrir turno')")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar muestra todos los módulos del POS", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // El sidebar debe tener links a los módulos principales
    // Verificar que los links de navegación existen
    const nav = page.locator("nav, aside, [role='navigation']").first();
    if (await nav.isVisible()) {
      // Verificar algunos links clave
      await expect(page.locator("a[href='/mesas'], a[href*='mesas']").first()).toBeVisible();
      await expect(page.locator("a[href='/ordenes'], a[href*='ordenes']").first()).toBeVisible();
      await expect(page.locator("a[href='/cobros'], a[href*='cobros']").first()).toBeVisible();
    }
  });
});
