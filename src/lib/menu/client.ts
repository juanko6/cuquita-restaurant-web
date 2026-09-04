/**
 * Acceso a la API pública de MenuUnfolded.
 *
 * Es el único sitio del proyecto que sabe que MenuUnfolded existe. Solo lo usa
 * scripts/fetch-menu.ts: durante el build el sitio lee de la caché y no toca la red.
 */
import {
  menuResponseSchema,
  restaurantResponseSchema,
  type MenuResponse,
  type RestaurantResponse,
} from './schema.ts';
import type { Locale } from './types.ts';

const API_BASE = 'https://menuunfolded.com/api/v1/public';
const RESTAURANT_SLUG = 'cuquita-restaurant';
const TIMEOUT_MS = 15_000;
const ATTEMPTS = 3;

export class MenuApiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'MenuApiError';
  }
}

async function getJson(url: string): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) {
        throw new MenuApiError(`${response.status} ${response.statusText} en ${url}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      // Espera creciente: 400 ms, 800 ms. Un 500 puntual no debería tumbar el build.
      if (attempt < ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }

  throw new MenuApiError(`No se pudo leer ${url} tras ${ATTEMPTS} intentos`, { cause: lastError });
}

export async function fetchRestaurant(): Promise<RestaurantResponse> {
  const raw = await getJson(`${API_BASE}/${RESTAURANT_SLUG}`);
  const parsed = restaurantResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new MenuApiError(
      `La respuesta del restaurante no tiene la forma esperada:\n${z_issues(parsed.error)}`,
    );
  }
  return parsed.data;
}

export async function fetchMenu(menuId: string, locale: Locale): Promise<MenuResponse> {
  const url = `${API_BASE}/${RESTAURANT_SLUG}/menus/${menuId}?lang=${locale}`;
  const raw = await getJson(url);
  const parsed = menuResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new MenuApiError(
      `La carta en "${locale}" no tiene la forma esperada:\n${z_issues(parsed.error)}`,
    );
  }
  return parsed.data;
}

/** Los errores de zod son ilegibles de serie; esto los deja en una lista de rutas. */
function z_issues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .slice(0, 10)
    .map((issue) => `  · ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
    .join('\n');
}
