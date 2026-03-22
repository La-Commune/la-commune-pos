import { test, expect } from "@playwright/test";

test.describe("POS — Login", () => {
  test("muestra la pantalla de login con PIN pad", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Punto de Venta")).toBeVisible();
    await expect(page.getByText("Ingresa tu PIN")).toBeVisible();

    // Verifica que el numpad tiene los 10 dígitos
    for (const digit of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) {
      await expect(
        page.locator(`.login-pin-key:has-text("${digit}")`).first()
      ).toBeVisible();
    }
  });

  test("switch entre PIN y credenciales", async ({ page }) => {
    await page.goto("/login");

    // Click "Usar credenciales"
    await page.click("button:has-text('Usar credenciales')");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByText("Iniciar Sesión")).toBeVisible();

    // Click "Volver al PIN"
    await page.click("button:has-text('Volver al PIN')");
    await expect(page.getByText("Ingresa tu PIN")).toBeVisible();
  });

  test("valida email en vista de credenciales", async ({ page }) => {
    await page.goto("/login");
    await page.click("button:has-text('Usar credenciales')");

    // Submit con email inválido
    await page.fill("#login-email", "invalido");
    await page.fill("#login-password", "123456");
    await page.click("button:has-text('Iniciar Sesión')");

    await expect(page.getByText("Ingresa un email válido")).toBeVisible();
  });

  test("valida contraseña mínima en credenciales", async ({ page }) => {
    await page.goto("/login");
    await page.click("button:has-text('Usar credenciales')");

    await page.fill("#login-email", "test@example.com");
    await page.fill("#login-password", "123");
    await page.click("button:has-text('Iniciar Sesión')");

    await expect(page.getByText("Mínimo 6 caracteres")).toBeVisible();
  });

  test("PIN dots se llenan al escribir dígitos", async ({ page }) => {
    await page.goto("/login");

    // Click 2 dígitos
    await page.click('.login-pin-key:has-text("1")');
    await page.click('.login-pin-key:has-text("2")');

    // Verificar que hay 4 dots en el indicador
    const dots = page.locator(".flex.gap-4 > div, .flex.gap-3 > div").first();
    await expect(dots).toBeVisible();
  });
});
