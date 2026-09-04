/**
 * Presupuesto de peso sobre dist/.
 *
 * Se mide **comprimido**, que es lo que de verdad viaja: Caddy sirve con `encode`
 * y ningún navegador de este siglo pide una página sin comprimir. Medir en crudo
 * castigaba a la carta, que son 88 fichas de markup casi idéntico y por eso se
 * comprime hasta la décima parte, y no decía nada sobre lo que tarda en llegar.
 *
 * Se informa también del tamaño en crudo, para que no haya nada escondido.
 *
 * Si esto falla, el sitio está engordando. El límite no se sube sin discutirlo.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const KB = 1024;

const PRESUPUESTOS = {
  '.html': { max: 20 * KB, label: 'HTML por página', porArchivo: true },
  '.css': { max: 10 * KB, label: 'CSS total', porArchivo: false },
  '.js': { max: 6 * KB, label: 'JS total', porArchivo: false },
};

async function recorrer(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await recorrer(ruta)));
    else salida.push(ruta);
  }
  return salida;
}

const kb = (bytes) => (bytes / KB).toFixed(1);

const archivos = await recorrer('dist');
const totales = { '.css': { crudo: 0, comprimido: 0 }, '.js': { crudo: 0, comprimido: 0 } };
const fallos = [];

for (const archivo of archivos) {
  const ext = extname(archivo);
  const presupuesto = PRESUPUESTOS[ext];
  if (!presupuesto) continue;

  const contenido = await readFile(archivo);
  const comprimido = gzipSync(contenido).length;
  const { size: crudo } = await stat(archivo);

  if (presupuesto.porArchivo) {
    const dentro = comprimido <= presupuesto.max;
    const linea = `${archivo}: ${kb(comprimido)} KB comprimido (${kb(crudo)} KB en crudo)`;
    if (dentro) console.log(`✔ ${linea}`);
    else fallos.push(`${linea} supera los ${presupuesto.max / KB} KB`);
  } else {
    totales[ext].crudo += crudo;
    totales[ext].comprimido += comprimido;
  }
}

for (const [ext, { crudo, comprimido }] of Object.entries(totales)) {
  const { max, label } = PRESUPUESTOS[ext];
  const linea = `${label}: ${kb(comprimido)} KB comprimido (${kb(crudo)} KB en crudo) de ${max / KB} KB`;
  if (comprimido <= max) console.log(`✔ ${linea}`);
  else fallos.push(linea);
}

if (fallos.length > 0) {
  console.error('\nPresupuesto de peso superado:');
  for (const fallo of fallos) console.error(`  ✖ ${fallo}`);
  process.exit(1);
}
