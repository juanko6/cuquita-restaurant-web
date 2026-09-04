import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Las rutas que ya existen. Crece con cada fase. */
const PAGINAS = [
  '/',
  '/en/',
  '/carta',
  '/en/menu',
  '/nuestra-experiencia',
  '/en/our-experience',
  '/visitanos',
  '/en/find-us',
  '/legal',
  '/en/legal',
];

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

test.describe('/carta', () => {
  test('las fichas de una misma fila miden lo mismo', async ({ page }) => {
    await page.goto('/carta');

    // 41 de los 88 platos no tienen descripción en español (decisión P-15). Lo que
    // no puede pasar es que dentro de una fila unas fichas queden más altas que
    // otras y el borde inferior salga en zigzag. Entre filas sí puede variar: cada
    // fila se ajusta a su contenido y eso está bien.
    const filas = await page.evaluate(() => {
      const rejilla = document.querySelector('.grupo__rejilla');
      if (!rejilla) return [];

      const porFila = new Map<number, number[]>();
      for (const hijo of rejilla.children) {
        const caja = hijo.getBoundingClientRect();
        const arriba = Math.round(caja.top);
        porFila.set(arriba, [...(porFila.get(arriba) ?? []), Math.round(caja.height)]);
      }
      return [...porFila.values()];
    });

    expect(filas.length).toBeGreaterThan(0);
    for (const alturas of filas) {
      expect(new Set(alturas).size, `en una fila hay alturas ${alturas.join(', ')}`).toBe(1);
    }
  });

  test('las ochenta y ocho fotos cargan', async ({ page }) => {
    const fallidas: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400) fallidas.push(`${r.status()} ${r.url()}`);
    });

    await page.goto('/carta');
    // Baja del todo para que se disparen las que cargan al acercarse.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((listo) => setTimeout(listo, 30));
      }
    });
    await page.waitForLoadState('networkidle');

    const rotas = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>('.plato img')]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.alt),
    );

    expect(rotas, 'fotos que no cargan').toEqual([]);
    expect(fallidas, 'peticiones fallidas').toEqual([]);
  });

  test('están las trece categorías y los ochenta y ocho platos', async ({ page }) => {
    await page.goto('/carta');

    await expect(page.locator('.grupo')).toHaveCount(13);
    await expect(page.locator('.plato')).toHaveCount(88);
  });

  test('el cambio de idioma lleva a la misma página en el otro idioma', async ({ page }) => {
    await page.goto('/carta');
    // El cambio de idioma vive dentro del menú, así que primero hay que abrirlo.
    await page.locator('.nav__boton').click();
    await page.getByRole('link', { name: 'English' }).click();

    await expect(page).toHaveURL(/\/en\/menu/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('portada', () => {
  test('el menú abre, se cierra con Escape y funciona con teclado', async ({ page }) => {
    await page.goto('/');
    const caja = page.locator('.nav__caja');
    const panel = page.locator('.nav__panel');

    await expect(panel).toBeHidden();
    await page.locator('.nav__boton').click();
    await expect(panel).toBeVisible();
    await expect(caja).toHaveAttribute('open');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('la semana tiene los siete días y el martes cerrado', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.semana__dia')).toHaveCount(7);
    await expect(page.locator('.semana__dia--cerrado')).toHaveCount(1);

    // Los platos que están todos los días van aparte, no bajo un día concreto:
    // si no, parecen cosa del miércoles.
    await expect(page.locator('.semana__siempre')).toContainText('Patacones');
    await expect(page.locator('.semana__dia').nth(2)).not.toContainText('Patacones');
  });

  test('el bloque del día y los seis destacados están', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.hoy__etiqueta')).toBeVisible();
    await expect(page.locator('.destacados .plato')).toHaveCount(6);
  });

  test('las reseñas se muestran citadas y con su autor', async ({ page }) => {
    await page.goto('/');

    const resenas = page.locator('.resena');
    await expect(resenas).toHaveCount(4);
    await expect(resenas.first().locator('.resena__pie')).not.toBeEmpty();
  });
});

test.describe('el resto de páginas', () => {
  test('la de experiencia cuenta la historia con los datos reales', async ({ page }) => {
    await page.goto('/nuestra-experiencia');

    await expect(page.locator('h1')).toContainText('familia');
    await expect(page.locator('main')).toContainText('La Paila');
    await expect(page.locator('main')).toContainText('2015');
    // La parrilla es de gas: la web no puede prometer carbón en ninguna parte.
    await expect(page.locator('main')).not.toContainText(/carbón|charcoal/i);
  });

  test('la de visita da horario, parqueadero y teléfono', async ({ page }) => {
    await page.goto('/visitanos');

    await expect(page.locator('.horario__fila')).toHaveCount(7);
    await expect(page.locator('main')).toContainText('960 Broadway');
    await expect(page.getByRole('link', { name: /610-868-5252/ }).first()).toBeVisible();
  });

  test('la 404 tiene salidas en los dos idiomas', async ({ page }) => {
    const respuesta = await page.goto('/no-existe-esta-pagina');

    expect(respuesta?.status()).toBe(404);
    await expect(page.getByRole('link', { name: 'English' })).toBeVisible();
  });

  test('todas las páginas llevan los datos del restaurante para Google', async ({ page }) => {
    await page.goto('/');

    const schema = await page.locator('script[type="application/ld+json"]').textContent();
    const datos = JSON.parse(schema ?? '{}');

    expect(datos['@type']).toBe('Restaurant');
    expect(datos.acceptsReservations).toBe(false);
    // Seis días: cierra los martes.
    expect(datos.openingHoursSpecification).toHaveLength(6);
  });
});
