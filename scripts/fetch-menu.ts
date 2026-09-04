/**
 * Refresca la carta desde MenuUnfolded: JSON de las dos versiones y las fotos.
 *
 * Se ejecuta a mano (`pnpm fetch:menu`) y desde el despliegue. El build NO lo llama:
 * lee de la caché versionada, así el CI construye sin depender de la red.
 *
 * Si la API falla, no se toca nada de lo que ya hay en disco.
 */
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { fetchMenu, fetchRestaurant } from '../src/lib/menu/client.ts';
import { writeCache } from '../src/lib/menu/cache.ts';
import { imageFileName } from '../src/lib/menu/mapper.ts';
import type { MenuResponse } from '../src/lib/menu/schema.ts';
import { LOCALES, type Locale } from '../src/lib/menu/types.ts';

const IMAGE_DIR = join(process.cwd(), 'src', 'assets', 'menu');

interface RemoteImage {
  readonly file: string;
  readonly url: string;
}

/** Las imágenes son las mismas en los dos idiomas, así que se juntan y se deduplican. */
function imagesOf(menu: MenuResponse): RemoteImage[] {
  const found = new Map<string, string>();

  for (const category of menu.categories) {
    for (const dish of category.dishes) {
      const file = imageFileName(dish.id, dish.image_url);
      if (file && dish.image_url) found.set(file, dish.image_url);
    }
  }
  for (const item of menu.featured_items) {
    const file = imageFileName(item.id, item.image_url);
    if (file && item.image_url) found.set(file, item.image_url);
  }

  return [...found].map(([file, url]) => ({ file, url }));
}

/**
 * Descarga y normaliza.
 *
 * La carta trae JPG, PNG y WebP mezclados, y los PNG llegan a 1,4 MB. Se convierte
 * todo a WebP y se limita a 1400 px: las fuentes son de 1200 px, así que no se pierde
 * nada, y el repositorio pasa de 21 MB a algo razonable. `astro:assets` deriva de aquí
 * los tamaños y formatos finales.
 */
const MAX_WIDTH = 1400;
const WEBP_QUALITY = 82;

async function download({ file, url }: RemoteImage): Promise<'nueva' | 'ya estaba'> {
  const path = join(IMAGE_DIR, file);

  try {
    if (statSync(path).size > 0) return 'ya estaba';
  } catch {
    // No existe todavía: se descarga.
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`${response.status} al descargar ${url}`);
  }

  const optimised = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  writeFileSync(path, optimised);
  return 'nueva';
}

async function main(): Promise<void> {
  mkdirSync(IMAGE_DIR, { recursive: true });

  const restaurant = await fetchRestaurant();
  const menuId = restaurant.menus[0].id;
  console.log(`Carta "${restaurant.menus[0].title}" de ${restaurant.restaurant.name}`);

  const menus = new Map<Locale, MenuResponse>();
  for (const locale of LOCALES) {
    const menu = await fetchMenu(menuId, locale);
    menus.set(locale, menu);

    const dishes = menu.categories.reduce((total, c) => total + c.dishes.length, 0);
    console.log(
      `  ${locale}: ${menu.categories.length} categorías, ${dishes} platos, ${menu.featured_items.length} especiales`,
    );
  }

  // Solo se escribe cuando las dos versiones han llegado bien: media carta es peor que ninguna.
  for (const [locale, menu] of menus) writeCache(locale, menu);

  const images = [...menus.values()].flatMap(imagesOf);
  const unique = new Map(images.map((image) => [image.file, image]));
  let nuevas = 0;

  for (const image of unique.values()) {
    if ((await download(image)) === 'nueva') nuevas += 1;
  }

  const enDisco = readdirSync(IMAGE_DIR).filter((name) => !name.startsWith('.')).length;
  console.log(`Fotos: ${nuevas} descargadas, ${enDisco} en src/assets/menu`);
}

main().catch((error: unknown) => {
  console.error('\nNo se pudo refrescar la carta. No se ha tocado nada en disco.\n');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
