import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default ts.config(
  { ignores: ['dist/', '.astro/', 'node_modules/', 'public/'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],

      // El reset quita las viñetas solo a ul[role="list"]: es el patrón que
      // devuelve la semántica de lista en Safari, donde `list-style: none` la
      // elimina. La regla lo ve redundante y en este caso no lo es.
      'astro/jsx-a11y/no-redundant-roles': ['error', { ul: ['list'] }],

      // Una región que se desplaza tiene que poder enfocarse con el teclado: lo
      // pide WCAG 2.1.1 y lo comprueba axe. La regla genérica solo contempla
      // elementos interactivos y no ese caso.
      'astro/jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['list'], allowExpressionValues: true },
      ],
    },
  },
  {
    // scripts/ corre en Node, no en el navegador, y sí informa por consola.
    files: ['scripts/**/*.{js,mjs,ts}'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', URL: 'readonly', Buffer: 'readonly' },
    },
    rules: { 'no-console': 'off' },
  },
);
