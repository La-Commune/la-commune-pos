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
      page.getByText("Abrir turno").first()
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(/fondo inicial/i).first()
    ).toBeVisible();
  });

  test("muestra campo de fondo inicial y quick amounts", async ({ page }) => {
    await expect(
      page.getByText(/fondo inicial/i).first()
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.locator("button").filter({ hasText: "$100" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "$200" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "$500" }).first()).toBeVisible();
  });

  test("quick amounts llenan el campo de fondo inicial", async ({ page }) => {
    await page.locator("button").filter({ hasText: "$200" }).first().waitFor({ timeout: 10_000 });
    await page.locator("button").filter({ hasText: "$200" }).first().click();

    const input = page.locator('input[type="number"]').first();
    await expect(input).toHaveValue("200");
  });

  test("botón Abrir turno está deshabilitado sin fondo", async ({ page }) => {
    const btnAbrir = page.locator("button").filter({ hasText: /abrir turno/i }).last();
    await btnAbrir.waitFor({ timeout: 10_000 });

    // Sin fondo, el botón está deshabilitado
    await expect(btnAbrir).toBeDisabled();
  });

  test("botón Abrir turno se habilita con fondo > 0", async ({ page }) => {
    await page.locator("button").filter({ hasText: "$200" }).first().waitFor({ timeout: 10_000 });
    await page.locator("button").filter({ hasText: "$200" }).first().click();

    const btnAbrir = page.locator("button").filter({ hasText: /abrir turno/i }).last();
    await expect(btnAbrir).toBeEnabled();
  });

  test("click en Abrir turno muestra diálogo de confirmación", async ({ page }) => {
    await page.locator("button").filter({ hasText: "$200" }).first().waitFor({ timeout: 10_000 });
    await page.locator("button").filter({ hasText: "$200" }).first().click();

    // Click en el botón principal de abrir turno
    await page.locator("button").filter({ hasText: /abrir turno/i }).last().click();

    // El ConfirmDialog debe aparecer
    await expect(
      page.getByText(/abrir con fondo/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("historial muestra panel lateral", async ({ page }) => {
    await expect(
      page.getByText(/histórico|historial/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // En mock mode sin cortes previos
    await expect(
      page.getByText(/sin cortes/i).first()
    ).toBeVisible();
  });
});
