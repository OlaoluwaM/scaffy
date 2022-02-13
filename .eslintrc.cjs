module.exports = {
  env: {
    es2021: true,
    node: true,
  },

  extends: ['airbnb-base', 'plugin:import/typescript', 'prettier'],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },

    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },

  plugins: ['@typescript-eslint'],

  rules: {
    'no-console': 0,
    'no-use-before-define': 0,
    'comma-dangle': 0,

    'wrap-iife': ['error', 'inside'],

    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
      },
    ],

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn'],

    'import/prefer-default-export': 0,

    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',

    'no-underscore-dangle': 0,
  },
};
