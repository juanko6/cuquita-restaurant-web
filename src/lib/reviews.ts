/**
 * Las reseñas que se muestran en la portada.
 *
 * Están citadas y atribuidas tal cual las escribieron sus autores en Google. No se
 * reescriben ni se "mejoran", y no se inventa ninguna. La lista es curada a mano y
 * está **pendiente de que el restaurante la apruebe** antes de publicar: son
 * palabras de clientes reales con su nombre.
 */
import datos from '../content/reviews.json' with { type: 'json' };

export interface Review {
  readonly id: string;
  readonly texto: string;
  readonly autor: string;
  readonly estrellas: number;
}

export const PERFIL_GOOGLE =
  'https://www.google.com/maps/search/Cuquita+Restaurant+960+Broadway+Fountain+Hill+PA';

export function reviews(): readonly Review[] {
  return datos.opiniones;
}

export function rating(): number {
  return datos.nota;
}
