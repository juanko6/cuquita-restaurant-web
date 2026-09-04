export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'carta',
        'home',
        'experiencia',
        'visita',
        'menu',
        'ui',
        'i18n',
        'seo',
        'a11y',
        'ci',
        'deploy',
        'deps',
        'docs',
      ],
    ],
    'subject-case': [0],
  },
};
