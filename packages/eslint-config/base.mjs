import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/** Cấu hình ESLint dùng chung cho mọi package TypeScript. */
export const base = tseslint.config(
  { ignores: ['dist/**', '.next/**', '.turbo/**', 'coverage/**', 'src/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  prettier,
);

export default base;
