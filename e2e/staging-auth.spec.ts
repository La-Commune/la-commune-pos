import { test, expect, loginWithCredentials } from "./fixtures/supabase-auth";

/**
 * Tests de autenticación contra Supabase staging (datos reales).
 *
 * Estos tests verifican:
 * - Login real via PIN → sesión Auth activa
 * - Login real via email/password
 * - Persistencia de sesión (reload mantiene auth)
 * - Logout real
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL configurado en .env.local
 * Ejecutar: npx playwright test e2e/staging-auth.spec.ts --project=staging
 */

// Skip si no hay Supabase URL (estamos en mock mode)
const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

test.describe("Staging — Autenticación real", () => {
  test.skip(!hasSupabase, "Requiere NEXT_PUBLIC_SUPABASE_URL");

  test("login via PIN redirige al Dashboard", async ({ authedPage: page }) => {
    // authedPage ya hizo login via PIN
    await expect(page.getByText("Dashboard")).toBeVisible();

    // Verificar que hay datos reales del negocio (no mock)
    await expect(page.getByText("La Commune")).toBeVisible();
  });

  test("sesión persiste después de reload", async ({ authedPage: page }) => {
    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should still be on dashboard, not redirected to login
    await expect(page.getByText("Dashboard")).toBeVisible({ timeout: 15_000 });
  });

  test("login via email/password funciona", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    test.skip(
      !email || !password,
      "Requiere TEST_USER_EMAIL y TEST_USER_PASSWORD",
    );

    await loginWithCredentials(page, email!, password!);
    await expect(page.getByText("Dashboard")).toBeVisible({ timeout: 15_000 });
  });

  test("PIN incorrecto muestra error", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Ingresa tu PIN")).toBeVisible({
      timeout: 15_000,
    });

    // Type invalid PIN
    for (const digit of ["9", "9", "9", "9"]) {
      await page.click(`.login-pin-key:has-text("${digit}")`);
      await page.waitForTimeout(150);
    }

    // Should show error — PIN incorrecto or similar
    await expect(
      page.getByText(/PIN inválido|incorrecto|error/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Should still be on login page
    await expect(page.getByText("Ingresa tu PIN")).toBeVisible();
  });
});
