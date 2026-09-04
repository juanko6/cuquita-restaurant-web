import { defineConfig, devices } from '@playwright/test';

// 4322 y no 4321: así las pruebas nunca se enganchan al servidor de desarrollo que
// alguien pueda tener abierto, que además inyecta la barra de herramientas de Astro.
const PORT = 4322;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Se prueba contra el sitio construido, no contra el servidor de desarrollo: es lo
 * que de verdad se publica.
 *
 * Los tres tamaños no son decorativos. La mayor parte del tráfico de un restaurante
 * llega desde un móvil, muchas veces de alguien parado en la puerta, así que el ancho
 * de 360 px es la primera pantalla que tiene que estar bien, no la última.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'móvil 360',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } },
    },
    {
      // Con chromium, no con el iPad real: hace falta un solo navegador descargado
      // y lo que se comprueba aquí es el ancho, no el motor.
      name: 'tableta 768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: 'escritorio 1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],

  webServer: {
    // No se usa `astro preview`: en Astro 7 se lanza en segundo plano y Playwright
    // necesita un proceso que se quede en primer plano. scripts/serve-dist.mjs sirve
    // exactamente lo que se despliega, sin la barra del modo desarrollo.
    command: `pnpm build && node scripts/serve-dist.mjs ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
