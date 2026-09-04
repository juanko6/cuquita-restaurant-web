/**
 * Las fotos de los platos, listas para `astro:assets`.
 *
 * Las descarga scripts/fetch-menu.ts a src/assets/menu con el id del plato por
 * nombre. Aquí se recogen todas de una vez para que un componente pueda pedir la
 * suya por ese nombre sin hacer un import dinámico por plato.
 */
import type { ImageMetadata } from 'astro';

const archivos = import.meta.glob<{ default: ImageMetadata }>('/src/assets/menu/*.webp', {
  eager: true,
});

const porNombre = new Map<string, ImageMetadata>(
  Object.entries(archivos).map(([ruta, modulo]) => [
    ruta.slice(ruta.lastIndexOf('/') + 1),
    modulo.default,
  ]),
);

/** Devuelve null si el plato no tiene foto: la ficha tiene que saber vivir sin ella. */
export function dishImage(file: string | null): ImageMetadata | null {
  return file ? (porNombre.get(file) ?? null) : null;
}

export function imageCount(): number {
  return porNombre.size;
}
