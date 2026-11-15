import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', '.scratch/', 'load/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Every skip must say why; a silent skip is a hole in coverage.
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/expect-expect': 'off',
    },
  },
);
