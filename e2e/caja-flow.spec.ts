import { test, expect } from "@playwright/test";

// En mock mode (sin Supabase), la caja cae a estado "sin_turno" directamente.
// Las operaciones de abrir/cerrar turno requieren Supabase, pero podemos
// testear toda la UI del flujo.

test.describe("POS — Flujo de Caja (mock mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/caja");
    await page.waitForLoadState("networkidle");
  });

  test("muestra pantalla de abrir turno", async ({ page }) => {
    await expect(
      page.locator("h1:has-text('Abrir turno')")
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator("text=Ingresa el fondo inicial en caja para comenzar")
    ).toBeVisible();
  });

  test("muestra campo de fondo inicial y quick amounts", async ({ page }) => {
    await expect(
      page.locator("text=Fondo inicial")
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("button:has-text('$100')")).toBeVisible();
    await expect(page.locator("button:has-text('$200')")).toBeVisible();
    await expect(page.locator("button:has-text('$500')")).toBeVisible();
  });

  test("quick amounts llenan el campo de fondo inicial", async ({ page }) => {
    await page.locator("button:has-text('$200')").waitFor({ timeout: 10_000 });
    await page.locator("button:has-text('$200')").click();

    const input = page.locator('input[type="number"]').first();
    await expect(input).toHaveValue("200");
  });

  test("botón Abrir turno está deshabilitado sin fondo", async ({ page }) => {
    const btnAbrir = page.locator("button:has-text('Abrir turno')").last();
    await btnAbrir.waitFor({ timeout: 10_000 });

    // Sin fondo, el botón tiene cursor-not-allowed
    await expect(btnAbrir).toBeDisabled();
  });

  test("botón Abrir turno se habilita con fondo > 0", async ({ page }) => {
    await page.locator("button:has-text('$200')").waitFor({ timeout: 10_000 });
    await page.locator("button:has-text('$200')").click();

    const btnAbrir = page.locator("button:has-text('Abrir turno')").last();
    await expect(btnAbrir).toBeEnabled();
  });

  test("click en Abrir turno muestra diálogo de confirmación", async ({ page }) => {
    await page.locator("button:has-text('$200')").waitFor({ timeout: 10_000 });
    await page.locator("button:has-text('$200')").click();

    // Click en el botón principal de abrir turno
    await page.locator("button:has-text('Abrir turno')").last().click();

    // El ConfirmDialog debe aparecer
    await expect(
      page.locator("text=¿Abrir con fondo inicial de")
    ).toBeVisible({ timeout: 5_000 });

    // Botón "Abrir" en el diálogo
    await expect(page.locator("button:has-text('Abrir')").last()).toBeVisible();
  });

  test("historial muestra panel lateral", async ({ page }) => {
    await expect(
      page.locator("text=Histórico")
    ).toBeVisible({ timeout: 10_000 });

    // En mock mode sin cortes previos
    await expect(
      page.locator("text=Sin cortes anteriores")
    ).toBeVisible();
  });
});
