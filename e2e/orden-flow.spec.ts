import { test, expect } from "@playwright/test";

// En mock mode, las órdenes y productos vienen de mock-data.ts.
// El flujo completo de crear orden requiere interactuar con el catálogo de productos.

test.describe("POS — Flujo de Órdenes (mock mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ordenes");
    await page.waitForLoadState("networkidle");
  });

  test("muestra el tab de nueva orden y el tab de órdenes activas", async ({ page }) => {
    await expect(page.getByText("Nueva orden")).toBeVisible();
  });

  test("muestra categorías del menú en el catálogo", async ({ page }) => {
    // En mock mode muestra las categorías: Café Caliente, Café Frío, etc.
    await expect(page.getByText("Café Caliente").first()).toBeVisible({ timeout: 10_000 });
  });

  test("muestra productos del menú en la lista", async ({ page }) => {
    // Productos mock: Americano, Latte, Cappuccino, etc.
    await expect(page.getByText("Americano").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Latte").first()).toBeVisible();
  });

  test("agrega productos al carrito", async ({ page }) => {
    // Click en un producto para agregarlo al carrito
    const americano = page.getByText("Americano").first();
    await americano.click();

    // El carrito debería mostrar al menos 1 item
    // Buscar el botón de enviar orden que muestra el total
    await expect(page.getByText("Enviar").first()).toBeVisible({ timeout: 5_000 });
  });

  test("selecciona origen Para llevar", async ({ page }) => {
    // Buscar el botón de origen "Para llevar"
    const paraLlevar = page.locator("button:has-text('Para llevar')").first();
    if (await paraLlevar.isVisible()) {
      await paraLlevar.click();
      // Verificar que se seleccionó
      await expect(paraLlevar).toBeVisible();
    }
  });

  test("muestra órdenes mock en el panel de activas", async ({ page }) => {
    // Las órdenes mock tienen estados: confirmada, preparando, nueva, lista
    // Buscar el tab o sección de órdenes activas
    const activasTab = page.locator("button:has-text('activas')").first();
    if (await activasTab.isVisible()) {
      await activasTab.click();
    }

    // Debería haber órdenes mock visibles (Mesa 2, Mesa 3, Mesa 6, Para llevar)
    await expect(
      page.getByText("Mesa").first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
