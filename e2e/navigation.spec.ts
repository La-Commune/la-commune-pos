import { test, expect } from "@playwright/test";

// En modo mock (sin SUPABASE_URL), el POS auto-logea como "David (Dev)" admin
// y todas las rutas están accesibles con datos mock.

test.describe("POS — Navegación (mock mode)", () => {
  test("carga el dashboard en modo mock", async ({ page }) => {
    await page.goto("/");
    // Dashboard muestra saludo + KPIs + accesos rápidos
    // Buscar el saludo dinámico que siempre incluye "David" (nombre del mock user)
    await expect(
      page.getByText("David").first()
    ).toBeVisible({ timeout: 15_000 });

    // Diagnóstico: capturar el contenido de main para entender qué se renderiza
    const mainContent = await page.locator("main").first().textContent().catch(() => "NO MAIN FOUND");
    console.log("[DIAG] main content:", mainContent?.substring(0, 500));

    // Verificar que hay KPIs visibles (siempre se renderizan, incluso durante carga)
    await expect(page.getByText("Ventas hoy").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de mesas", async ({ page }) => {
    await page.goto("/mesas");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de órdenes", async ({ page }) => {
    await page.goto("/ordenes");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de cobros", async ({ page }) => {
    await page.goto("/cobros");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de caja", async ({ page }) => {
    await page.goto("/caja");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de menú", async ({ page }) => {
    await page.goto("/menu");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de reportes", async ({ page }) => {
    await page.goto("/reportes");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });
});
