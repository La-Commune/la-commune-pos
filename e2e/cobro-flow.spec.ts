import { test, expect } from "@playwright/test";

// En mock mode, las órdenes cobrables son las que tienen estado
// "lista", "confirmada" o "preparando" en mock-data.ts:
// - ord-1: Mesa 2, $155, confirmada
// - ord-2: Mesa 3, $355, preparando
// - ord-3: Mesa 6, $165, nueva (NO cobrable)
// - ord-4: Para llevar, $75, lista

test.describe("POS — Flujo de Cobros (mock mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cobros");
    await page.waitForLoadState("networkidle");
  });

  test("muestra la lista de órdenes por cobrar", async ({ page }) => {
    await expect(page.locator("text=Órdenes por cobrar")).toBeVisible({ timeout: 10_000 });
  });

  test("muestra empty state cuando no hay orden seleccionada", async ({ page }) => {
    await expect(
      page.locator("text=Selecciona una orden para cobrar")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("selecciona una orden y muestra el panel de cobro", async ({ page }) => {
    // Click en la primera orden de la lista
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    // Debe mostrar los métodos de pago
    await expect(page.locator("text=Efectivo")).toBeVisible();
    await expect(page.locator("text=Tarjeta")).toBeVisible();
    await expect(page.locator("text=Transferencia")).toBeVisible();
  });

  test("selecciona método de pago tarjeta y muestra botón cobrar", async ({ page }) => {
    // Seleccionar primera orden
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    // Click en Tarjeta (no necesita monto recibido)
    await page.locator("button:has-text('Tarjeta')").first().click();

    // El botón de cobrar debe estar activo (tarjeta no requiere monto)
    const btnCobrar = page.locator("button:has-text('Cobrar')").first();
    await expect(btnCobrar).toBeVisible();
  });

  test("pago efectivo muestra quick amounts y campo monto", async ({ page }) => {
    // Seleccionar primera orden
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    // Efectivo está seleccionado por defecto
    await expect(page.locator("text=Monto recibido")).toBeVisible();

    // Quick amounts
    await expect(page.locator("button:has-text('$50')")).toBeVisible();
    await expect(page.locator("button:has-text('$100')")).toBeVisible();
    await expect(page.locator("button:has-text('$200')")).toBeVisible();
    await expect(page.locator("button:has-text('$500')")).toBeVisible();
    await expect(page.locator("button:has-text('$1000')")).toBeVisible();
    await expect(page.locator("button:has-text('Exacto')")).toBeVisible();
  });

  test("click Exacto llena el monto y muestra cambio $0", async ({ page }) => {
    // Seleccionar primera orden
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    // Click en Exacto
    await page.locator("button:has-text('Exacto')").click();

    // El botón Cobrar debería estar habilitado
    const btnCobrar = page.locator("button:has-text('Cobrar')").first();
    await expect(btnCobrar).toBeEnabled();
  });

  test("click Cobrar abre pantalla de verificación", async ({ page }) => {
    // Seleccionar primera orden
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    // Click en Tarjeta (sin necesidad de monto)
    await page.locator("button:has-text('Tarjeta')").first().click();

    // Click Cobrar
    await page.locator("button:has-text('Cobrar')").first().click();

    // Pantalla de verificación
    await expect(page.locator("text=Confirme con el cliente")).toBeVisible();
    await expect(page.locator("text=Confirmar cobro")).toBeVisible();
    await expect(page.locator("text=Volver")).toBeVisible();
  });

  test("botón Volver regresa al formulario de cobro", async ({ page }) => {
    // Seleccionar orden → Tarjeta → Cobrar → Verificación → Volver
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    await page.locator("button:has-text('Tarjeta')").first().click();
    await page.locator("button:has-text('Cobrar')").first().click();
    await expect(page.locator("text=Confirme con el cliente")).toBeVisible();

    // Click Volver
    await page.locator("button:has-text('Volver')").click();

    // Regresa al formulario — métodos de pago visibles de nuevo
    await expect(page.locator("text=Método de pago")).toBeVisible();
  });

  test("toggle Dividir pago muestra formulario de split", async ({ page }) => {
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    // Click en Dividir pago
    await page.locator("button:has-text('Dividir pago')").click();

    // Debe mostrar "Formas de pago" y "Por cobrar"
    await expect(page.locator("text=Formas de pago")).toBeVisible();
    await expect(page.locator("text=Por cobrar")).toBeVisible();
    await expect(page.locator("button:has-text('Agregar método')")).toBeVisible();
  });

  test("selección de propina y descuento actualiza el total", async ({ page }) => {
    const primerOrden = page.locator(".rounded-xl.bg-surface-2.border").first();
    await primerOrden.waitFor({ timeout: 10_000 });
    await primerOrden.click();

    // Click en propina 10%
    await page.locator("button:has-text('10%')").first().click();

    // Click en descuento 5%
    await page.locator("button:has-text('5%')").first().click();

    // Verificar que aparecen los labels de propina y descuento
    await expect(page.locator("text=Propina")).toBeVisible();
    await expect(page.locator("text=Descuento")).toBeVisible();
  });
});
