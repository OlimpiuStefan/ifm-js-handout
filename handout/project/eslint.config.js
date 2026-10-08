// The gate. Every rule here is something that went wrong in the course first.
export default [
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module' },
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }], // === everywhere, except `== null` ("is it missing?")
      'no-empty': ['error', { allowEmptyCatch: false }], // `catch {}` is error hiding, not error handling
      'no-unsafe-finally': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'require-await': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { ignores: ['node_modules/**', 'dist/**'] },
];
