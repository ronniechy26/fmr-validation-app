// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportNamedDeclaration > TSTypeAliasDeclaration',
          message: 'Reusable types must be defined under the /types directory.',
        },
        {
          selector: 'ExportNamedDeclaration > TSInterfaceDeclaration',
          message: 'Reusable types must be defined under the /types directory.',
        },
      ],
    },
  },
  {
    files: ['types/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
