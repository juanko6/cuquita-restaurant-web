import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Las rutas que ya existen. Crece con cada fase. */
const PAGINAS = ['/'];

/**
 * Un píxel de margen. Los anchos se calculan en subpíxeles y un 0,4 de redondeo no
 * es un desbordamiento real. La misma tolerancia se usa para buscar culpables y para
 * decidir si falla: si no, la prueba puede fallar sin señalar a nadie.
 */
const TOLERANCIA = 1;

/**
 * Qué se sale del ancho de la ventana.
 *
 * El desbordamiento horizontal es el fallo más común y más molesto en móvil: la
 * página se desplaza de lado, el texto se corta y no aparece ningún aviso en consola.
 * Devuelve también los culpables para no tener que buscarlos a mano.
 */
async function desbordamiento(page: Page) {
  return page.evaluate((tolerancia) => {
    const raiz = document.documentElement;
    const limite = raiz.clientWidth + tolerancia;

    return {
      anchoDeScroll: raiz.scrollWidth,
      anchoDeVentana: raiz.clientWidth,
      culpables: [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > limite)
        .slice(0, 5)
        .map((el) => {
          const clase = typeof el.className === 'string' && el.className ? `.${el.className}` : '';
          return `${el.tagName.toLowerCase()}${clase}`;
        }),
    };
  }, TOLERANCIA);
}

for (const ruta of PAGINAS) {
  test.describe(ruta, () => {
    test('no se desplaza en horizontal', async ({ page }) => {
      await page.goto(ruta);
      const { anchoDeScroll, anchoDeVentana, culpables } = await desbordamiento(page);

      expect(
        anchoDeScroll,
        culpables.length > 0 ? `Se salen del ancho: ${culpables.join(', ')}` : 'Algo desborda',
      ).toBeLessThanOrEqual(anchoDeVentana + TOLERANCIA);
    });

    test('el titular se lee sin tener que desplazar', async ({ page }) => {
      await page.goto(ruta);
      const titular = page.locator('main h1');

      await expect(titular).toBeVisible();
      await expect(titular).toBeInViewport();
    });

    test('el salto al contenido funciona con teclado', async ({ page }) => {
      await page.goto(ruta);
      await page.keyboard.press('Tab');

      await expect(page.locator('.skip-link')).toBeFocused();
    });

    test('sin fallos de accesibilidad', async ({ page }) => {
      await page.goto(ruta);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(
        violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`),
        'Fallos de accesibilidad',
      ).toEqual([]);
    });
  });
}
