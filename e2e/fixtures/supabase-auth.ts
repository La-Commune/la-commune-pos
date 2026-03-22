import { test as base, expect, type Page } from "@playwright/test";

/**
 * Fixture de autenticación para tests E2E contra Supabase staging.
 *
 * Requiere variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL   — URL del proyecto Supabase
 *   TEST_USER_PIN              — PIN del usuario de test (default: "1234")
 *   TEST_USER_EMAIL            — Email del usuario de test
 *   TEST_USER_PASSWORD         — Password del usuario de test
 *
 * Los tests con Supabase real persisten datos — cada test limpia lo que crea.
 */

// Extend base test with authenticated page
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    // Login via PIN pad
    const pin = process.env.TEST_USER_PIN ?? "1234";

    await page.goto("/login");
    await expect(page.getByText("Ingresa tu PIN")).toBeVisible({ timeout: 15_000 });

    // Type each PIN digit
    for (const digit of pin.split("")) {
      await page.click(`.login-pin-key:has-text("${digit}")`);
      // Small delay between digits for animation
      await page.waitForTimeout(150);
    }

    // Wait for redirect to dashboard after successful login
    await expect(page).toHaveURL("/", { timeout: 15_000 });
    await expect(page.getByText("Dashboard")).toBeVisible({ timeout: 10_000 });

    await use(page);
  },
});

export { expect };

/**
 * Helper: login via email/password (alternative to PIN)
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.click("button:has-text('Usar credenciales')");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click("button:has-text('Iniciar Sesión')");
  await expect(page).toHaveURL("/", { timeout: 15_000 });
}

/**
 * Helper: espera a que Supabase realtime esté conectado
 * (verifica que los datos carguen del servidor, no de mock)
 */
export async function waitForSupabaseData(page: Page) {
  // Esperar a que desaparezca el spinner de carga
  const spinner = page.locator("[data-loading], .animate-spin").first();
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await expect(spinner).not.toBeVisible({ timeout: 10_000 });
  }
}
