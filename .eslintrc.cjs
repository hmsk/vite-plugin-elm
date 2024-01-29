module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: { ecmaVersion: 8 },
  ignorePatterns: ['dist/*', 'example/*'],
  extends: ['eslint:recommended', 'prettier'],
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      rules: {
        eqeqeq: 'error',
        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },
  ],
}
