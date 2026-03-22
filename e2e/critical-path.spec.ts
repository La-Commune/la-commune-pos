import { test, expect } from "@playwright/test";

// Test del flujo crítico completo del POS en mock mode:
// Dashboard → Caja → Órdenes → Cobros
//
// En mock mode no hay Supabase, así que las operaciones de escritura
// no persisten. Este test verifica que la UI se renderiza correctamente.

test.describe("POS — Flujo Crítico Completo (mock mode)", () => {
  test("navega por todos los módulos del flujo principal", async ({ page }) => {
    // 1. Dashboard carga correctamente — buscar el nombre del usuario mock
    await page.goto("/");
    await expect(page.getByText("David").first()).toBeVisible({ timeout: 15_000 });
    // KPIs siempre se renderizan (muestran "..." durante carga)
    await expect(page.getByText("Ventas hoy").first()).toBeVisible({ timeout: 10_000 });

    // 2. Navegar a Caja — pantalla de abrir turno
    await page.goto("/caja");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });

    // 3. Navegar a Órdenes — tab activas por default
    await page.goto("/ordenes");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });

    // Cambiar al tab "Nueva orden" para ver el catálogo
    const tabNueva = page.locator("button").filter({ hasText: /nueva orden/i }).first();
    await tabNueva.click();

    // Seleccionar origen "Para llevar" para avanzar al catálogo de productos
    const paraLlevar = page.locator("button").filter({ hasText: /para llevar/i }).first();
    await paraLlevar.waitFor({ timeout: 10_000 });
    await paraLlevar.click();

    // Verificar que hay productos mock disponibles
    await expect(page.getByText("Americano").first()).toBeVisible({ timeout: 10_000 });

    // Verificar categorías
    await expect(page.getByText("Café Caliente").first()).toBeVisible();

    // 4. Navegar a Cobros
    await page.goto("/cobros");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar muestra todos los módulos del POS", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("David").first()).toBeVisible({ timeout: 15_000 });

    // Verificar links de navegación
    await expect(page.locator("a[href='/mesas'], a[href*='mesas']").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("a[href='/ordenes'], a[href*='ordenes']").first()).toBeVisible();
    await expect(page.locator("a[href='/cobros'], a[href*='cobros']").first()).toBeVisible();
  });
});
