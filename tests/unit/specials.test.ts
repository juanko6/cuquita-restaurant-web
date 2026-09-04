import { describe, expect, it } from 'vitest';
import {
  headlineSpecial,
  specialsForDay,
  toMenuDayIndex,
  weekdayFromIndex,
  type Special,
} from '../../src/lib/specials';

/** Datos reales de la carta de Cuquita en MenuUnfolded. */
const specials: Special[] = [
  {
    id: '1',
    title: 'Especial del día: Sopa de pollo',
    price: 14.99,
    recurrenceDays: [0],
    isActive: true,
  },
  { id: '2', title: 'Jueves de Lentejas', price: 14.99, recurrenceDays: [3], isActive: true },
  { id: '3', title: 'Sancocho costilla de res', price: 16.99, recurrenceDays: [4], isActive: true },
  {
    id: '4',
    title: 'Especial del día: sopa de mondongo',
    price: 14.99,
    recurrenceDays: [5],
    isActive: true,
  },
  {
    id: '5',
    title: 'Patacones, chicharrón y guacamole',
    price: 12.99,
    recurrenceDays: [0, 2, 3, 4, 5, 6],
    isActive: true,
  },
  {
    id: '6',
    title: 'Brazo de reina frío',
    price: 5.99,
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
  },
];

describe('toMenuDayIndex', () => {
  it('trata el lunes como índice 0', () => {
    expect(toMenuDayIndex(new Date('2026-09-07T12:00:00'))).toBe(0); // lunes
  });

  it('trata el domingo como índice 6', () => {
    expect(toMenuDayIndex(new Date('2026-09-06T12:00:00'))).toBe(6); // domingo
  });
});

describe('weekdayFromIndex', () => {
  it('devuelve el nombre del día', () => {
    expect(weekdayFromIndex(3)).toBe('jueves');
  });

  it('rechaza índices fuera de rango', () => {
    expect(() => weekdayFromIndex(7)).toThrow(RangeError);
  });
});

describe('specialsForDay', () => {
  it('el martes solo deja el que sale todos los días', () => {
    const martes = specialsForDay(specials, 1);
    expect(martes.map((s) => s.title)).toEqual(['Brazo de reina frío']);
  });

  it('ignora los especiales desactivados', () => {
    const apagados = specials.map((s) => ({ ...s, isActive: false }));
    expect(specialsForDay(apagados, 3)).toHaveLength(0);
  });

  it('rechaza índices fuera de rango', () => {
    expect(() => specialsForDay(specials, -1)).toThrow(RangeError);
  });
});

describe('headlineSpecial', () => {
  it('el jueves manda las lentejas y no los patacones diarios', () => {
    expect(headlineSpecial(specials, 3)?.title).toBe('Jueves de Lentejas');
  });

  it('el viernes manda el sancocho', () => {
    expect(headlineSpecial(specials, 4)?.title).toBe('Sancocho costilla de res');
  });

  it('devuelve null cuando no hay nada activo', () => {
    expect(headlineSpecial([], 2)).toBeNull();
  });
});
