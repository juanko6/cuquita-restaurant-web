/** El único sitio donde se decide cómo se escribe un precio. */
const dolares = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function money(amount: number): string {
  return dolares.format(amount);
}
