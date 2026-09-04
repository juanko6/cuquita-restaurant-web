/**
 * Los platos que llevan el peso de la portada.
 *
 * La selección sale del análisis: cruzan lo que más mencionan las reseñas, lo que
 * ya tiene foto y el ticket que conviene empujar. Se buscan por nombre y no por id
 * porque los ids de MenuUnfolded no dicen nada a quien lea esto dentro de un año;
 * un test comprueba que los seis siguen existiendo.
 */
import type { Dish, Menu } from './types.ts';

export const DESTACADOS = [
  'Bandeja paisa',
  'Parrillada Cuquita',
  'Picada Cuquita',
  'Empanadas',
  'Pargo Rojo Frito',
  'Pandebono',
] as const;

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

/**
 * Devuelve los destacados en el orden en que están escritos arriba. Si alguno ya no
 * está en la carta, sale de la lista en vez de romper la portada: la carta la
 * gobierna el restaurante y puede quitar un plato cualquier día.
 */
export function featuredDishes(menu: Menu): Dish[] {
  const platos = menu.categories.flatMap((categoria) => categoria.dishes);

  return DESTACADOS.map((buscado) =>
    platos.find((plato) => normalizar(plato.name).startsWith(normalizar(buscado))),
  ).filter((plato): plato is Dish => plato !== undefined);
}
