import { describe, expect, it } from 'vitest';
import { money } from '../../src/lib/format.ts';

describe('money', () => {
  it('escribe los precios como los ve un cliente en Pensilvania', () => {
    expect(money(23.99)).toBe('$23.99');
    expect(money(2.5)).toBe('$2.50');
    expect(money(34)).toBe('$34.00');
  });

  it('no se deja céntimos por el camino', () => {
    expect(money(16.9)).toBe('$16.90');
  });
});
