import { describe, expect, it } from 'vitest';
import { copy, otroIdioma, ruta, RUTAS } from '../../src/lib/i18n.ts';
import { LOCALES } from '../../src/lib/menu/types.ts';

/** Todas las claves del objeto, en plano: 'carta.titulo', 'nav.pedir'… */
function claves(objeto: unknown, prefijo = ''): string[] {
  if (Array.isArray(objeto)) return [prefijo];
  if (typeof objeto !== 'object' || objeto === null) return [prefijo];
  return Object.entries(objeto).flatMap(([clave, valor]) =>
    claves(valor, prefijo ? `${prefijo}.${clave}` : clave),
  );
}

describe('los textos de los dos idiomas', () => {
  it('tienen exactamente las mismas claves', () => {
    // Es la forma barata de no dejarse un bloque sin traducir: si alguien añade
    // un texto en español y se olvida del inglés, esto falla y dice cuál.
    expect(claves(copy('en')).sort()).toEqual(claves(copy('es')).sort());
  });

  it('no dejan ningún texto vacío', () => {
    for (const locale of LOCALES) {
      const vacios = JSON.stringify(copy(locale)).match(/"[a-zA-Z]+":\s*""/g) ?? [];
      expect(vacios, `textos vacíos en ${locale}`).toEqual([]);
    }
  });

  it('no repite el español dentro del inglés en los textos visibles', () => {
    // Un descuido típico al traducir: copiar el bloque y cambiar solo la mitad.
    expect(copy('en').carta.entradilla).not.toBe(copy('es').carta.entradilla);
    expect(copy('en').nav.carta).not.toBe(copy('es').nav.carta);
  });
});

describe('las rutas', () => {
  it('tienen una versión por idioma', () => {
    for (const nombre of Object.keys(RUTAS) as (keyof typeof RUTAS)[]) {
      for (const locale of LOCALES) {
        expect(ruta(nombre, locale)).toMatch(/^\//);
      }
    }
  });

  it('el español vive en la raíz y el inglés bajo /en/', () => {
    expect(ruta('carta', 'es')).toBe('/carta');
    expect(ruta('carta', 'en')).toMatch(/^\/en\//);
  });

  it('otroIdioma va y vuelve', () => {
    expect(otroIdioma('es')).toBe('en');
    expect(otroIdioma(otroIdioma('es'))).toBe('es');
  });
});
