/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  verbose: true,
  // setupFilesAfterEnv: ['<rootDir>/tests/test-setup.ts'],
  transform: {},
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleFileExtensions: ['js', 'ts', 'mjs'],
  moduleNameMapper: {
    '#ansi-styles':
      '<rootDir>/node_modules/zx/node_modules/chalk/source/vendor/ansi-styles/index.js',
    '#supports-color':
      '<rootDir>/node_modules/zx/node_modules/chalk/source/vendor/supports-color/index.js',
  },
};
