/**
 * Los textos de la web, fuera de las plantillas.
 *
 * Ningún literal de copy dentro de un `.astro`: así se traduce todo en un sitio y
 * un test comprueba que las dos versiones tienen exactamente las mismas claves, que
 * es la forma barata de no dejarse un bloque sin traducir.
 */
import es from '../content/copy/es.json' with { type: 'json' };
import en from '../content/copy/en.json' with { type: 'json' };
import type { Locale } from './menu/types.ts';

const copias = { es, en } as const;

export type Copy = typeof es;

export function copy(locale: Locale): Copy {
  return copias[locale];
}

/** Las rutas equivalentes en cada idioma, para el enlace de cambio y el hreflang. */
export const RUTAS = {
  inicio: { es: '/', en: '/en/' },
  carta: { es: '/carta', en: '/en/menu' },
} as const;

export type Ruta = keyof typeof RUTAS;

export function ruta(nombre: Ruta, locale: Locale): string {
  return RUTAS[nombre][locale];
}

export function otroIdioma(locale: Locale): Locale {
  return locale === 'es' ? 'en' : 'es';
}
