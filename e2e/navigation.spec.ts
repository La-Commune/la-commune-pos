import { test, expect } from "@playwright/test";

// En modo mock (sin SUPABASE_URL), el POS auto-logea como "David (Dev)" admin
// y todas las rutas están accesibles con datos mock.

test.describe("POS — Navegación (mock mode)", () => {
  test("carga el dashboard en modo mock", async ({ page }) => {
    await page.goto("/");
    // Dashboard muestra un saludo dinámico: "Buenos días/tardes/noches, David"
    // y la sección de "Accesos rápidos"
    await expect(
      page.getByText("Accesos rápidos").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("navega al módulo de mesas", async ({ page }) => {
    await page.goto("/mesas");
    // Buscar el heading principal, no el link del sidebar
    await expect(page.locator("main").getByText("Mesas").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de órdenes", async ({ page }) => {
    await page.goto("/ordenes");
    await expect(page.getByText("Nueva orden").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de cobros", async ({ page }) => {
    await page.goto("/cobros");
    await expect(page.getByText("Órdenes por cobrar").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de caja", async ({ page }) => {
    await page.goto("/caja");
    // En mock mode cae a sin_turno (no tiene Supabase)
    await expect(
      page.getByText("Abrir turno").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de menú", async ({ page }) => {
    await page.goto("/menu");
    // Buscar contenido del módulo, no el link del sidebar
    await expect(page.locator("main").getByText("Menú").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navega al módulo de reportes", async ({ page }) => {
    await page.goto("/reportes");
    await expect(page.locator("main").getByText("Reportes").first()).toBeVisible({ timeout: 10_000 });
  });
});
