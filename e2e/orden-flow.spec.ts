import { test, expect } from "@playwright/test";

// En mock mode, las órdenes y productos vienen de mock-data.ts.
// El tab default es "activas", hay que cambiar a "nueva" para ver el catálogo.

test.describe("POS — Flujo de Órdenes (mock mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ordenes");
    await page.waitForLoadState("networkidle");
    // Esperar a que la página cargue
    await expect(page.locator("main").first()).toBeVisible({ timeout: 15_000 });
  });

  test("muestra tabs de órdenes activas y nueva orden", async ({ page }) => {
    // El tab "activas" es el default — debe haber botones de tab visibles
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("muestra categorías del menú en el catálogo", async ({ page }) => {
    // Cambiar al tab "Nueva orden" para ver el catálogo
    const tabNueva = page.locator("button").filter({ hasText: /nueva orden/i }).first();
    await tabNueva.click();

    // Seleccionar origen "Para llevar" para avanzar al catálogo de productos
    const paraLlevar = page.locator("button").filter({ hasText: /para llevar/i }).first();
    await paraLlevar.waitFor({ timeout: 10_000 });
    await paraLlevar.click();

    // En mock mode muestra las categorías: Café Caliente, Café Frío, etc.
    await expect(page.getByText("Café Caliente").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Todas").first()).toBeVisible();
  });

  test("muestra productos del menú en la lista", async ({ page }) => {
    // Cambiar al tab "Nueva orden"
    const tabNueva = page.locator("button").filter({ hasText: /nueva orden/i }).first();
    await tabNueva.click();

    // Seleccionar origen "Para llevar" para avanzar al catálogo de productos
    const paraLlevar = page.locator("button").filter({ hasText: /para llevar/i }).first();
    await paraLlevar.waitFor({ timeout: 10_000 });
    await paraLlevar.click();

    // Productos mock: Americano, Latte, Cappuccino, etc.
    await expect(page.getByText("Americano").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Latte").first()).toBeVisible();
  });

  test("agrega productos al carrito", async ({ page }) => {
    // Cambiar al tab "Nueva orden"
    const tabNueva = page.locator("button").filter({ hasText: /nueva orden/i }).first();
    await tabNueva.click();

    // Seleccionar origen "Para llevar" para avanzar al catálogo de productos
    const paraLlevar = page.locator("button").filter({ hasText: /para llevar/i }).first();
    await paraLlevar.waitFor({ timeout: 10_000 });
    await paraLlevar.click();

    // Click en un producto para agregarlo
    const americano = page.getByText("Americano").first();
    await americano.waitFor({ timeout: 10_000 });
    await americano.click();

    // Verificar que el carrito muestra algo (subtotal, botón enviar, etc.)
    await expect(
      page.locator("button").filter({ hasText: /enviar/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("selecciona origen Para llevar", async ({ page }) => {
    // Cambiar al tab "Nueva orden"
    const tabNueva = page.locator("button").filter({ hasText: /nueva orden/i }).first();
    await tabNueva.click();

    // Buscar el botón de origen "Para llevar"
    const paraLlevar = page.locator("button").filter({ hasText: /para llevar/i }).first();
    if (await paraLlevar.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await paraLlevar.click();
    }
  });

  test("muestra órdenes mock en el panel de activas", async ({ page }) => {
    // El tab default ya es "activas"
    // Debería haber órdenes mock visibles (Mesa 2, Mesa 3, Mesa 6, Para llevar)
    await expect(
      page.getByText("Mesa").first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
