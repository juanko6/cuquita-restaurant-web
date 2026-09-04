import { describe, expect, it } from 'vitest';
import { DESTACADOS, featuredDishes } from '../../src/lib/menu/featured.ts';
import { getMenu } from '../../src/lib/menu/index.ts';
import { LOCALES } from '../../src/lib/menu/types.ts';

describe('los platos destacados de la portada', () => {
  for (const locale of LOCALES) {
    it(`siguen existiendo los seis en la carta en ${locale}`, () => {
      // Se buscan por nombre, así que si el restaurante renombra o quita uno, esto
      // avisa aquí en vez de dejar un hueco en la portada sin que nadie se entere.
      const encontrados = featuredDishes(getMenu(locale));

      expect(
        encontrados.length,
        `faltan: ${DESTACADOS.filter((d) => !encontrados.some((p) => p.name.toLowerCase().startsWith(d.toLowerCase().slice(0, 6)))).join(', ')}`,
      ).toBe(DESTACADOS.length);
    });
  }

  it('los devuelve en el orden en que están escritos', () => {
    const nombres = featuredDishes(getMenu('es')).map((plato) => plato.name);
    expect(nombres[0]).toMatch(/bandeja paisa/i);
    expect(nombres.at(-1)).toMatch(/pandebono/i);
  });

  it('todos tienen foto: la portada se sostiene sobre ellas', () => {
    expect(featuredDishes(getMenu('es')).every((plato) => plato.image)).toBe(true);
  });
});
