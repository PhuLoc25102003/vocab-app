import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { base } from '@vocab/eslint-config';
import { webBoundaries } from '@vocab/eslint-config/boundaries';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...base,
  webBoundaries,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
