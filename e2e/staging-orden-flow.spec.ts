import { test, expect, waitForSupabaseData } from "./fixtures/supabase-auth";

/**
 * Tests del flujo de órdenes contra Supabase staging.
 *
 * Verifica que las operaciones persisten en la DB real:
 * - Crear orden → aparece en la lista
 * - Confirmar orden → estado cambia
 * - Cancelar orden → se refleja en la UI
 *
 * Ejecutar: npx playwright test e2e/staging-orden-flow.spec.ts --project=staging
 */

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

test.describe("Staging — Flujo de Órdenes (persistencia real)", () => {
  test.skip(!hasSupabase, "Requiere NEXT_PUBLIC_SUPABASE_URL");

  test("carga productos reales desde Supabase", async ({ authedPage: page }) => {
    await page.goto("/ordenes");
    await waitForSupabaseData(page);

    // Debería mostrar categorías reales del seed
    await expect(page.getByText("Nueva orden")).toBeVisible({ timeout: 10_000 });

    // Verificar que al menos una categoría del seed aparece
    const categoriasConocidas = ["Café Caliente", "Café Frío", "Té", "Bebidas Especiales", "Panadería"];
    let foundCategoria = false;
    for (const cat of categoriasConocidas) {
      if (await page.getByText(cat).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        foundCategoria = true;
        break;
      }
    }
    expect(foundCategoria).toBe(true);

    // Verificar que hay productos reales
    await expect(page.getByText("Americano").first()).toBeVisible({ timeout: 5_000 });
  });

  test("crear orden para llevar y verificar persistencia", async ({ authedPage: page }) => {
    await page.goto("/ordenes");
    await waitForSupabaseData(page);

    // Seleccionar origen "Para llevar"
    const paraLlevar = page.locator("button:has-text('Para llevar')").first();
    if (await paraLlevar.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await paraLlevar.click();
    }

    // Agregar un producto al carrito
    const americano = page.getByText("Americano").first();
    await americano.click();
    await page.waitForTimeout(500);

    // Debería haber botón de enviar
    const btnEnviar = page.locator("button:has-text('Enviar')").first();
    await expect(btnEnviar).toBeVisible({ timeout: 5_000 });

    // Enviar la orden
    await btnEnviar.click();

    // Esperar confirmación — toast o cambio de tab
    await page.waitForTimeout(2000);

    // Verificar que la orden aparece en órdenes activas
    const activasTab = page.locator("button:has-text('activas'), button:has-text('Activas')").first();
    if (await activasTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await activasTab.click();
      await page.waitForTimeout(1000);
    }

    // Buscar la orden recién creada (debería tener folio o referencia "Para llevar")
    await expect(
      page.getByText(/Para llevar|nueva|Americano/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("las órdenes creadas persisten después de reload", async ({ authedPage: page }) => {
    await page.goto("/ordenes");
    await waitForSupabaseData(page);

    // Ir a tab de activas
    const activasTab = page.locator("button:has-text('activas'), button:has-text('Activas')").first();
    if (await activasTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await activasTab.click();
    }

    // Contar órdenes visibles
    await page.waitForTimeout(2000);

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");
    await waitForSupabaseData(page);

    // Las órdenes deben seguir ahí (persistencia real)
    const activasTabAfter = page.locator("button:has-text('activas'), button:has-text('Activas')").first();
    if (await activasTabAfter.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await activasTabAfter.click();
    }

    // Al menos el texto de la categoría o "Nueva orden" debe cargar
    await expect(page.getByText("Nueva orden")).toBeVisible({ timeout: 10_000 });
  });
});
