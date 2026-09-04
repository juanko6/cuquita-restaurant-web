// @ts-check
import { defineConfig } from 'astro/config';

/**
 * El muestrario de componentes vive fuera de src/pages y su ruta solo se inyecta
 * cuando se arranca `astro dev`. En un build de producción la página no llega a
 * existir: ni HTML, ni las veinte imágenes que optimizaría para nada, ni peso en
 * el presupuesto. Más limpio que generarla y borrarla después.
 */
/** @type {import('astro').AstroIntegration} */
const muestrarioSoloEnDesarrollo = {
  name: 'muestrario-solo-en-desarrollo',
  hooks: {
    'astro:config:setup': ({ command, injectRoute, logger }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/dev/componentes', entrypoint: './src/dev/componentes.astro' });
      logger.info('Muestrario disponible en /dev/componentes');
    },
  },
};

export default defineConfig({
  integrations: [muestrarioSoloEnDesarrollo],

  site: 'https://cuquitarestaurant.co',

  // Español en la raíz, inglés bajo /en/. Ver PLAN-DESARROLLO.md §1.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  build: {
    // Un solo archivo CSS en lugar de uno por página: cabe de sobra en el
    // presupuesto de 25 KB y se cachea entre navegaciones.
    inlineStylesheets: 'never',
  },
});
