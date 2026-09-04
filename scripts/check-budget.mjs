/**
 * Comprueba los presupuestos de peso sobre dist/.
 * Si esto falla, el sitio está engordando. No se sube el límite sin discutirlo.
 */
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BUDGETS = {
  '.html': { max: 40 * 1024, label: 'HTML por página' },
  '.css': { max: 25 * 1024, label: 'CSS total' },
  '.js': { max: 15 * 1024, label: 'JS total' },
};

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const files = await walk('dist');
const totals = { '.css': 0, '.js': 0 };
const failures = [];

for (const file of files) {
  const ext = extname(file);
  const { size } = await stat(file);

  if (ext === '.html' && size > BUDGETS['.html'].max) {
    failures.push(`${file}: ${(size / 1024).toFixed(1)} KB supera los 40 KB de HTML`);
  }
  if (ext in totals) totals[ext] += size;
}

for (const [ext, total] of Object.entries(totals)) {
  const { max, label } = BUDGETS[ext];
  const kb = (total / 1024).toFixed(1);
  if (total > max) failures.push(`${label}: ${kb} KB supera los ${max / 1024} KB`);
  else console.log(`✔ ${label}: ${kb} KB de ${max / 1024} KB`);
}

if (failures.length > 0) {
  console.error('\nPresupuesto de peso superado:');
  for (const f of failures) console.error(`  ✖ ${f}`);
  process.exit(1);
}
