import { describe, expect, it } from 'vitest';
import { getMenu } from '../../src/lib/menu/index.ts';
import { readCache, MenuCacheError } from '../../src/lib/menu/cache.ts';
import { imageFileName, toMenu } from '../../src/lib/menu/mapper.ts';
import { menuResponseSchema } from '../../src/lib/menu/schema.ts';

describe('la caché versionada', () => {
  it('tiene las dos versiones y pasan el mismo esquema que la API', () => {
    expect(() => readCache('es')).not.toThrow();
    expect(() => readCache('en')).not.toThrow();
  });

  it('avisa con un mensaje útil si falta un idioma', () => {
    // @ts-expect-error se comprueba a propósito un idioma que no existe
    expect(() => readCache('fr')).toThrow(MenuCacheError);
  });
});

describe('getMenu', () => {
  it('devuelve la carta completa en español', () => {
    const menu = getMenu('es');
    const dishes = menu.categories.flatMap((category) => category.dishes);

    expect(menu.categories).toHaveLength(13);
    expect(dishes).toHaveLength(88);
    expect(menu.restaurantName).toBe('Cuquita Restaurant');
  });

  it('trae los seis especiales con sus días', () => {
    const menu = getMenu('es');
    const lentejas = menu.specials.find((special) => /lentejas/i.test(special.title));

    expect(menu.specials).toHaveLength(6);
    expect(lentejas?.recurrenceDays).toEqual([3]);
  });

  it('deja los platos sin descripción como null y no como cadena vacía', () => {
    const dishes = getMenu('es').categories.flatMap((category) => category.dishes);
    const sinTexto = dishes.filter((dish) => dish.description === null);

    // Decisión del cliente (P-15): la carta se queda como está. La ficha de plato
    // tiene que funcionar con estos 41 sin descripción.
    expect(sinTexto.length).toBeGreaterThan(0);
    expect(dishes.every((dish) => dish.description !== '')).toBe(true);
  });

  it('da a todos los platos una foto normalizada a webp', () => {
    const dishes = getMenu('es').categories.flatMap((category) => category.dishes);
    expect(dishes.every((dish) => dish.image?.endsWith('.webp'))).toBe(true);
  });

  it('la versión en inglés tiene los mismos platos y más descripciones', () => {
    const es = getMenu('es').categories.flatMap((category) => category.dishes);
    const en = getMenu('en').categories.flatMap((category) => category.dishes);
    const descritos = (dishes: typeof es) => dishes.filter((d) => d.description).length;

    expect(en.map((d) => d.id).sort()).toEqual(es.map((d) => d.id).sort());
    expect(descritos(en)).toBeGreaterThan(descritos(es));
  });
});

describe('el mapeo', () => {
  const base = menuResponseSchema.parse(readCache('es'));

  it('ordena las categorías por su sort_order y no por el orden de llegada', () => {
    const revuelto = { ...base, categories: [...base.categories].reverse() };
    const orders = toMenu(revuelto, 'es').categories.map((category) => category.order);

    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('descarta las categorías vacías: no pintan nada en la carta', () => {
    const conVacia = {
      ...base,
      categories: [...base.categories, { ...base.categories[0], id: 'vacia', dishes: [] }],
    };
    const ids = toMenu(conVacia, 'es').categories.map((category) => category.id);

    expect(ids).not.toContain('vacia');
  });
});

describe('imageFileName', () => {
  it('nombra por el id del plato, no por el archivo remoto', () => {
    expect(imageFileName('abc-123', 'https://example.com/uploads/dish_2026.jpg')).toBe(
      'abc-123.webp',
    );
  });

  it('devuelve null cuando el plato no trae foto', () => {
    expect(imageFileName('abc-123', null)).toBeNull();
  });
});
