/**
 * Especiales del día.
 *
 * MenuUnfolded guarda cada especial con un array `recurrence_days` de enteros 0-6.
 * El índice 0 es lunes: "Jueves de Lentejas" viene con [3], y el martes —el único día
 * que el restaurante cierra— es el único índice sin ningún especial asignado.
 * Queda una comprobación pendiente contra el panel de MenuUnfolded antes de publicar
 * (ver PENDIENTES.md).
 */

export const WEEKDAYS = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export interface Special {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly recurrenceDays: readonly number[];
  readonly isActive: boolean;
}

/** Índice de MenuUnfolded (0 = lunes) a partir de una fecha. */
export function toMenuDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function weekdayFromIndex(index: number): Weekday {
  const day = WEEKDAYS[index];
  if (!day) throw new RangeError(`Índice de día fuera de rango: ${index}`);
  return day;
}

/**
 * Especiales activos de un día concreto, en el orden en que llegan.
 * Devuelve un array vacío los días sin especial: el bloque de la home se apaga solo.
 */
export function specialsForDay(specials: readonly Special[], dayIndex: number): Special[] {
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
    throw new RangeError(`Índice de día fuera de rango: ${dayIndex}`);
  }
  return specials.filter((s) => s.isActive && s.recurrenceDays.includes(dayIndex));
}

/**
 * El especial que encabeza el bloque "Hoy en Cuquita": el más específico del día.
 * Un plato que solo sale los jueves manda sobre uno que sale todos los días.
 */
export function headlineSpecial(specials: readonly Special[], dayIndex: number): Special | null {
  const todays = specialsForDay(specials, dayIndex);
  if (todays.length === 0) return null;
  return todays.reduce((most, candidate) =>
    candidate.recurrenceDays.length < most.recurrenceDays.length ? candidate : most,
  );
}
