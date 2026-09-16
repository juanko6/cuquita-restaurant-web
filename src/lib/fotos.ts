/**
 * Las fotos del local que salen en más de una página, con su encuadre al lado.
 *
 * La foto y su `foco` van juntos porque son el mismo dato: el recorte que hace
 * falta depende de lo que hay dentro de esa imagen en concreto, no de la página
 * que la enseña. Separados, la portada y la de visita acabarían recortando la
 * misma fachada por sitios distintos.
 *
 * Las que solo usa un sitio —la mesa servida, los clientes— se quedan importadas
 * donde se usan: no hay nada que compartir todavía.
 */
import fachadaSrc from '../assets/local/fachada.webp';

export interface Foto {
  readonly src: ImageMetadata;
  /** El `object-position` del recorte. Ver `ui/Frame.astro`. */
  readonly foco: string;
}

/**
 * Es la única foto vertical del sitio y el marco es apaisado, así que del recorte
 * solo sobrevive una franja. Centrada se comía el letrero, que es justo lo que hay
 * que reconocer al llegar: el foco sube para dejarlo dentro.
 */
export const FACHADA: Foto = {
  src: fachadaSrc,
  foco: 'center 25%',
};
