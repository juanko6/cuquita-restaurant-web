/** El único sitio donde se decide cómo se escribe un precio. */
const dolares = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function money(amount: number): string {
  return dolares.format(amount);
}

/**
 * Parte un texto marcado con asteriscos en tramos: `*así*` sale resaltado.
 *
 * Las palabras que se resaltan cambian con el idioma —"montaña" y "the mountains"
 * no caen en el mismo sitio de la frase—, así que la marca vive en el copy y no en
 * la plantilla. Y en asteriscos y no en HTML: nada de `set:html` sobre un archivo
 * de textos, que es la puerta por la que entra el marcado que nadie revisó.
 */
export interface Tramo {
  readonly texto: string;
  readonly fuerte: boolean;
}

export function tramos(texto: string): Tramo[] {
  return texto
    .split(/\*([^*]+)\*/g)
    .map((trozo, indice) => ({ texto: trozo, fuerte: indice % 2 === 1 }))
    .filter(({ texto: trozo }) => trozo !== '');
}
