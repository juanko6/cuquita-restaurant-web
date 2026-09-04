/**
 * El modelo de la carta, en nuestros términos.
 *
 * No copia el de MenuUnfolded a propósito: sus `is_featured`, `featured_size` y
 * `recurrence_days` se traducen aquí. Si algún día se cambia de proveedor, esto no
 * se toca — solo el adaptador que hay detrás de `getMenu`.
 */

export const LOCALES = ['es', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export interface Dish {
  readonly id: string;
  readonly name: string;
  /** 41 de los 88 platos no tienen descripción en español. La ficha no puede depender de ella. */
  readonly description: string | null;
  readonly price: number;
  /** Nombre del archivo descargado en src/assets/menu, o null si el plato no trae foto. */
  readonly image: string | null;
  readonly isAvailable: boolean;
  readonly allergens: readonly string[];
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly dishes: readonly Dish[];
}

/** Un especial del día. Su lógica de qué día toca vive en lib/specials.ts. */
export interface Special {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly price: number;
  /** Índices de 0 (lunes) a 6 (domingo). */
  readonly recurrenceDays: readonly number[];
  readonly isActive: boolean;
  readonly image: string | null;
}

export interface Menu {
  readonly locale: Locale;
  readonly restaurantName: string;
  readonly categories: readonly Category[];
  readonly specials: readonly Special[];
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
