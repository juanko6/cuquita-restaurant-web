/**
 * La única puerta de entrada a la carta.
 *
 * Ningún componente importa nada de esta carpeta salvo esto y los tipos. Todo lo
 * demás —MenuUnfolded, zod, el mapeo— queda detrás.
 */
import { readCache } from './cache.ts';
import { toMenu } from './mapper.ts';
import type { Locale, Menu } from './types.ts';

const cache = new Map<Locale, Menu>();

/** La carta completa en un idioma. Lee de disco: no toca la red durante el build. */
export function getMenu(locale: Locale): Menu {
  const already = cache.get(locale);
  if (already) return already;

  const menu = toMenu(readCache(locale), locale);
  cache.set(locale, menu);
  return menu;
}

export { MenuCacheError } from './cache.ts';
export type { Category, Dish, Locale, Menu, Special } from './types.ts';
export { LOCALES, isLocale } from './types.ts';
