/**
 * De la respuesta de MenuUnfolded al modelo del dominio.
 *
 * Aquí es donde se decide qué campos suyos nos importan y cómo se llaman los nuestros.
 */
import type { MenuResponse } from './schema.ts';
import type { Category, Dish, Locale, Menu, Special } from './types.ts';

/**
 * Nombre del archivo con el que se guarda una imagen.
 *
 * Se nombra por el id del plato y no por el archivo remoto: dos platos pueden
 * compartir foto, y así cada uno tiene la suya y el nombre no cambia aunque en
 * MenuUnfolded suban una imagen nueva.
 *
 * Siempre `.webp` porque scripts/fetch-menu.ts normaliza al descargar: la carta trae
 * JPG, PNG y WebP mezclados, y los PNG pesan hasta 1,4 MB cada uno.
 */
export function imageFileName(id: string, sourceUrl: string | null): string | null {
  return sourceUrl ? `${id}.webp` : null;
}

function toDish(raw: MenuResponse['categories'][number]['dishes'][number]): Dish {
  return {
    id: raw.id,
    name: raw.name.trim(),
    description: raw.description?.trim() || null,
    price: raw.price,
    image: imageFileName(raw.id, raw.image_url),
    isAvailable: raw.is_available,
    allergens: raw.allergens,
  };
}

function toCategory(raw: MenuResponse['categories'][number]): Category {
  return {
    id: raw.id,
    name: raw.name.trim(),
    order: raw.sort_order,
    dishes: raw.dishes.map(toDish),
  };
}

function toSpecial(raw: MenuResponse['featured_items'][number]): Special {
  return {
    id: raw.id,
    title: raw.title.trim(),
    description: raw.description?.trim() || null,
    price: raw.price,
    recurrenceDays: [...raw.recurrence_days].sort((a, b) => a - b),
    isActive: raw.is_active,
    image: imageFileName(raw.id, raw.image_url),
  };
}

export function toMenu(raw: MenuResponse, locale: Locale): Menu {
  return {
    locale,
    restaurantName: raw.restaurant.name,
    categories: [...raw.categories]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toCategory)
      // Una categoría sin platos no pinta nada en la carta.
      .filter((category) => category.dishes.length > 0),
    specials: [...raw.featured_items].sort((a, b) => a.sort_order - b.sort_order).map(toSpecial),
  };
}
