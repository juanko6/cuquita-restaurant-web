/**
 * La carta guardada en disco, versionada en el repositorio.
 *
 * Es lo que hace que `pnpm build` funcione sin red y que un fallo de MenuUnfolded
 * el día de una publicación no saque una carta vacía. La refresca
 * scripts/fetch-menu.ts; el sitio solo la lee.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { menuResponseSchema, type MenuResponse } from './schema.ts';
import type { Locale } from './types.ts';

const CACHE_DIR = join(process.cwd(), 'src', 'data', 'menu');

export class MenuCacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MenuCacheError';
  }
}

export function cachePath(locale: Locale): string {
  return join(CACHE_DIR, `${locale}.json`);
}

export function writeCache(locale: Locale, response: MenuResponse): void {
  writeFileSync(cachePath(locale), `${JSON.stringify(response, null, 2)}\n`, 'utf8');
}

/**
 * Lee la caché y la valida con el mismo esquema que la respuesta de la API: si
 * alguien edita el JSON a mano y lo rompe, se ve aquí y no en la página publicada.
 */
export function readCache(locale: Locale): MenuResponse {
  const path = cachePath(locale);
  let contents: string;

  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    throw new MenuCacheError(
      `No hay carta en caché para "${locale}" (${path}). Ejecuta \`pnpm fetch:menu\`.`,
    );
  }

  const parsed = menuResponseSchema.safeParse(JSON.parse(contents));
  if (!parsed.success) {
    throw new MenuCacheError(
      `La carta en caché para "${locale}" está corrupta:\n${parsed.error.issues
        .slice(0, 10)
        .map((issue) => `  · ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
        .join('\n')}`,
    );
  }
  return parsed.data;
}
