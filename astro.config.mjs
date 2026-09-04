// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
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
