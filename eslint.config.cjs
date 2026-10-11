const { defineConfig, globalIgnores } = require('eslint/config')

const globals = require('globals')
const tsParser = require('@typescript-eslint/parser')
const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

module.exports = defineConfig([
  {
    languageOptions: {
      globals: globals.node,

      ecmaVersion: 8,
      parserOptions: {},
    },

    extends: compat.extends('eslint:recommended', 'prettier'),
  },
  globalIgnores(['dist/*', 'example/*']),
  {
    files: ['**/*.ts'],

    languageOptions: {
      parser: tsParser,
    },

    extends: compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),

    rules: {
      eqeqeq: 'error',

      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
])
