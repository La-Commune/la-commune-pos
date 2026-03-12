import { test, expect } from "@playwright/test";

// En modo mock (sin SUPABASE_URL), el POS auto-logea como "David (Dev)" admin
// y todas las rutas están accesibles con datos mock.

test.describe("POS — Navegación (mock mode)", () => {
  test("carga el dashboard en modo mock", async ({ page }) => {
    await page.goto("/");
    // Dashboard muestra KPIs del día
    await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de mesas", async ({ page }) => {
    await page.goto("/mesas");
    await expect(page.locator("text=Mesas")).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de órdenes", async ({ page }) => {
    await page.goto("/ordenes");
    await expect(page.locator("text=Nueva orden")).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de cobros", async ({ page }) => {
    await page.goto("/cobros");
    await expect(page.locator("text=Cobros")).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de caja", async ({ page }) => {
    await page.goto("/caja");
    // En mock mode cae a sin_turno (no tiene Supabase)
    await expect(
      page.locator("h1:has-text('Abrir turno')")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de menú", async ({ page }) => {
    await page.goto("/menu");
    await expect(page.locator("text=Menú")).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de reportes", async ({ page }) => {
    await page.goto("/reportes");
    await expect(page.locator("text=Reportes")).toBeVisible({ timeout: 10_000 });
  });
});
