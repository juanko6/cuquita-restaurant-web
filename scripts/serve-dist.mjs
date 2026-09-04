/**
 * Servidor estático de dist/ para las pruebas end-to-end.
 *
 * `astro preview` se lanza en segundo plano y Playwright necesita un proceso que se
 * quede en primer plano, así que sirve esta pieza de treinta líneas. Además sirve
 * exactamente lo que se despliega, sin la barra de herramientas del modo desarrollo.
 *
 *   node scripts/serve-dist.mjs [puerto]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = Number(process.argv[2] ?? 4322);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Resuelve una ruta a un archivo, probando también /ruta/index.html y /ruta.html. */
function resolver(pathname) {
  // normalize + el prefijo obligatorio evitan que un ../ se salga de dist/.
  const limpio = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const base = join(ROOT, limpio);
  if (!base.startsWith(ROOT)) return null;

  for (const candidato of [base, join(base, 'index.html'), `${base}.html`]) {
    if (existsSync(candidato) && statSync(candidato).isFile()) return candidato;
  }
  return null;
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', `http://localhost:${PORT}`);
  const archivo = resolver(pathname);

  if (!archivo) {
    const noEncontrado = join(ROOT, '404.html');
    if (existsSync(noEncontrado)) {
      response.writeHead(404, { 'content-type': TIPOS['.html'] });
      createReadStream(noEncontrado).pipe(response);
      return;
    }
    response.writeHead(404, { 'content-type': TIPOS['.txt'] });
    response.end(`No existe ${pathname}\n`);
    return;
  }

  response.writeHead(200, {
    'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream',
  });
  createReadStream(archivo).pipe(response);
}).listen(PORT, () => {
  console.log(`dist/ servido en http://localhost:${PORT}`);
});
