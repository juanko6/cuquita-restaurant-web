/**
 * Especiales del día.
 *
 * MenuUnfolded guarda cada especial con un array `recurrence_days` de enteros 0-6.
 * El índice 0 es lunes: "Jueves de Lentejas" viene con [3], el martes —el único día que
 * el restaurante cierra— es el único índice sin especial propio, y construido un viernes
 * la home saca el sancocho. El mapeo es correcto.
 *
 * Lo que sigue abierto no es técnico: confirmar con el restaurante que esos son de
 * verdad los días de cada plato (ver PENDIENTES.md).
 */

import type { Special } from './menu/types.ts';

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

export type { Special };

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
