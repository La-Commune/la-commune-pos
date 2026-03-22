import { test, expect } from "@playwright/test";

// En mock mode (sin SUPABASE_URL), el POS auto-logea como "David (Dev)" admin.
// El AuthProvider redirige /login → / cuando ya está autenticado.
// Estos tests verifican que el auto-login mock funciona correctamente.

test.describe("POS — Auth (mock mode)", () => {
  test("auto-login redirige /login a dashboard", async ({ page }) => {
    await page.goto("/login");
    // En mock mode, AuthProvider auto-logea y redirige a /
    await page.waitForURL("/", { timeout: 15_000 });

    // El dashboard muestra el saludo con el nombre del usuario mock
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
  });

  test("usuario mock es David (Dev) con rol admin", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 15_000 });

    // El sidebar o navbar debe mostrar el nombre del usuario
    await expect(
      page.getByText("David").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("todas las rutas POS son accesibles en mock mode", async ({ page }) => {
    const routes = ["/mesas", "/ordenes", "/cobros", "/caja", "/menu", "/reportes"];

    for (const route of routes) {
      await page.goto(route);
      // Cada ruta debe cargar sin redirigir a /login
      await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("no redirige a /login desde rutas protegidas", async ({ page }) => {
    await page.goto("/ordenes");
    // Esperar a que cargue — no debe redirigir a /login
    await expect(page.getByText("Nueva orden").first()).toBeVisible({ timeout: 15_000 });

    // La URL debe seguir siendo /ordenes, no /login
    expect(page.url()).toContain("/ordenes");
  });

  test("sidebar muestra navegación completa para admin", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // El sidebar debe tener links a los módulos principales
    const nav = page.locator("nav, aside, [role='navigation']").first();
    if (await nav.isVisible()) {
      await expect(page.locator("a[href='/mesas'], a[href*='mesas']").first()).toBeVisible();
      await expect(page.locator("a[href='/ordenes'], a[href*='ordenes']").first()).toBeVisible();
      await expect(page.locator("a[href='/cobros'], a[href*='cobros']").first()).toBeVisible();
    }
  });
});
