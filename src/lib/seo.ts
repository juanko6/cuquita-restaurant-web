/**
 * Datos estructurados del restaurante.
 *
 * Es lo que hace que Google muestre el horario, el "abierto ahora" y el enlace a la
 * carta directamente en el resultado de búsqueda. Para un restaurante de barrio eso
 * pesa más que cualquier otra cosa que hagamos en la web.
 *
 * Todo lo que hay aquí está verificado: la dirección y el teléfono salen del propio
 * restaurante, el horario del perfil de Google y el rango de precio de la carta real.
 */
import { RUTAS } from './i18n.ts';
import type { Locale } from './menu/types.ts';

export const NEGOCIO = {
  nombre: 'Cuquita Restaurant',
  telefono: '+1-610-868-5252',
  calle: '960 Broadway',
  ciudad: 'Fountain Hill',
  region: 'PA',
  codigoPostal: '18015',
  pais: 'US',
  instagram: 'https://www.instagram.com/cuquitarestaurant/',
  facebook: 'https://www.facebook.com/cuquitarestaurant',
} as const;

/**
 * Las redes, en el orden en que se enseñan.
 *
 * Origen único: hasta ahora la dirección de Instagram estaba escrita a mano en la
 * portada, en la experiencia, en el pie y aquí, y añadir Facebook habría hecho
 * ocho copias de dos cadenas que tienen que coincidir.
 *
 * El nombre va aquí y no en los textos porque «Instagram» y «Facebook» se llaman
 * igual en español y en inglés, y ya vivían sueltos dentro del pie.
 *
 * La antigua `facebook.com/Cuquita-Restaurant-115248308497887/` del sitio viejo no
 * es otra página: redirige a esta, que es la misma con nombre de usuario.
 */
export const REDES = [
  { nombre: 'Instagram', url: NEGOCIO.instagram },
  { nombre: 'Facebook', url: NEGOCIO.facebook },
] as const;

/** Lunes es 0 en MenuUnfolded; schema.org los quiere por nombre en inglés. */
const DIAS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** Cierra los martes. Viernes y sábado hasta las 20:00; el resto, hasta las 18:00. */
const HORARIO: readonly { dia: (typeof DIAS)[number]; abre: string; cierra: string }[] =
  DIAS.filter((dia) => dia !== 'Tuesday').map((dia) => ({
    dia,
    abre: '11:00',
    cierra: dia === 'Friday' || dia === 'Saturday' ? '20:00' : '18:00',
  }));

export function restaurantSchema(locale: Locale, site: URL | undefined): string {
  const base = site?.origin ?? 'https://cuquitarestaurant.co';

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: NEGOCIO.nombre,
    url: `${base}${RUTAS.inicio[locale]}`,
    telephone: NEGOCIO.telefono,
    servesCuisine: 'Colombian',
    priceRange: '$$',
    currenciesAccepted: 'USD',
    acceptsReservations: false,
    hasMenu: `${base}${RUTAS.carta[locale]}`,
    sameAs: REDES.map((red) => red.url),
    address: {
      '@type': 'PostalAddress',
      streetAddress: NEGOCIO.calle,
      addressLocality: NEGOCIO.ciudad,
      addressRegion: NEGOCIO.region,
      postalCode: NEGOCIO.codigoPostal,
      addressCountry: NEGOCIO.pais,
    },
    openingHoursSpecification: HORARIO.map(({ dia, abre, cierra }) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${dia}`,
      opens: abre,
      closes: cierra,
    })),
  });
}
