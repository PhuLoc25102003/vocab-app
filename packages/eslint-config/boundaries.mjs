import boundaries from 'eslint-plugin-boundaries';

/** `from` chỉ được import các loại trong `to`. */
function allow(from, to) {
  return { from: { element: { type: from } }, allow: { to: { element: { types: to } } } };
}

function createBoundaries({ elements, files = [], policies, checkInternals = false }) {
  return {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/generated/**'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': elements,
      'boundaries/files': files,
      'import/resolver': { typescript: { project: 'tsconfig.json' } },
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', checkInternals, policies }],
    },
  };
}

export const webBoundaries = createBoundaries({
  elements: [
    { type: 'app', pattern: 'src/app' },
    { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
    { type: 'common', pattern: 'src/components/common' },
    { type: 'ui', pattern: 'src/components/ui' },
    { type: 'lib', pattern: 'src/lib' },
  ],
  policies: [
    allow('app', ['feature', 'common', 'ui', 'lib']),
    allow('feature', ['common', 'ui', 'lib']),
    {
      from: { element: { type: 'feature', captured: { feature: 'import' } } },
      allow: { to: { element: { type: 'feature', captured: { feature: 'sets' } } } },
    },
    allow('common', ['ui', 'lib']),
    allow('ui', ['lib']),
  ],
});

/** Cấm lớp `from` import các lớp và element trong `to`. Đặt sau các luật cho phép. */
function forbid(from, { layers = [], elements = [] }) {
  return {
    from: { file: { categories: from } },
    disallow: [
      ...(layers.length > 0 ? [{ to: { file: { categories: layers } } }] : []),
      ...(elements.length > 0 ? [{ to: { element: { types: elements } } }] : []),
    ],
  };
}

export const apiBoundaries = createBoundaries({
  checkInternals: true,
  elements: [
    { type: 'config', pattern: 'src/config' },
    { type: 'generated', pattern: 'src/generated' },
    { type: 'prisma', pattern: 'src/infrastructure/prisma' },
    { type: 'infrastructure', pattern: 'src/infrastructure/*', capture: ['name'] },
    { type: 'common', pattern: 'src/common' },
    { type: 'module', pattern: 'src/modules/*', capture: ['module'] },
  ],
  files: [
    { pattern: '**/src/main.ts', category: 'bootstrap' },
    { pattern: '**/src/app.module.ts', category: 'bootstrap' },
    { pattern: '**/src/modules/*/*.controller.ts', category: 'controller' },
    { pattern: '**/src/modules/*/*.service.ts', category: 'service' },
    { pattern: '**/src/modules/*/*.repository.ts', category: 'repository' },
    { pattern: '**/src/modules/*/*.module.ts', category: 'nest-module' },
  ],
  policies: [
    allow('config', ['config']),
    allow('prisma', ['prisma', 'config', 'generated']),
    allow('infrastructure', ['infrastructure', 'config']),
    allow('common', ['common', 'config', 'prisma']),
    allow('module', ['module', 'common', 'config', 'infrastructure']),
    {
      from: { file: { categories: ['repository', 'nest-module'] } },
      allow: { to: { element: { types: ['prisma', 'generated'] } } },
    },
    {
      from: { file: { categories: 'bootstrap' } },
      allow: [
        { to: { element: { types: ['config', 'common', 'prisma', 'infrastructure', 'module'] } } },
        { to: { file: { categories: 'bootstrap' } } },
      ],
    },
    forbid('controller', {
      layers: ['controller', 'repository', 'nest-module'],
      elements: ['config', 'infrastructure'],
    }),
    forbid('service', { layers: ['controller', 'nest-module'] }),
    forbid('repository', {
      layers: ['controller', 'service', 'nest-module'],
      elements: ['infrastructure'],
    }),
  ],
});

/** `packages/shared` chạy ở cả web và API nên không phụ thuộc framework hay app. */
export const sharedBoundaries = {
  files: ['src/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              'react',
              'react-dom',
              'next',
              'next/*',
              '@nestjs/*',
              '@vocab/web',
              '@vocab/api',
            ],
            message: '@vocab/shared không được phụ thuộc framework hoặc app.',
          },
          {
            group: ['**/apps/**'],
            message: 'packages không được import apps.',
          },
        ],
      },
    ],
  },
};
