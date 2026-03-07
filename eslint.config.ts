import { recommended } from 'lazyconvex/eslint'
import { eslint } from 'lintmax/eslint'

export default eslint({
  append: [
    {
      ...recommended,
      files: ['packages/be/**/*.ts', 'packages/be/**/*.tsx'],
      rules: {
        ...recommended.rules,
        'lazyconvex/discovery-check': 'off',
        'lazyconvex/no-unprotected-mutation': 'off',
        'lazyconvex/require-rate-limit': 'off'
      }
    },
    {
      files: ['apps/**/*.ts', 'apps/**/*.tsx', 'packages/be/**/*.ts', 'packages/be/**/*.tsx'],
      ignores: ['**/env.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            importNames: ['env'],
            message: "Use `import env from '~/env'` instead to ensure validated types.",
            name: 'process'
          }
        ],
        'no-restricted-properties': [
          'error',
          {
            message: "Use `import env from '~/env'` instead to ensure validated types.",
            object: 'process',
            property: 'env'
          }
        ]
      }
    }
  ],
  ignores: [
    '**/e2e/**',
    'eslint.config.ts',
    'genenv.ts',
    'lintmax.config.ts',
    'packages/be/convex/f.test.ts',
    'packages/be/convex/org-api.test.ts',
    'packages/be/convex/edge.test.ts',
    'packages/ui/**',
    'tooling/eslint/**'
  ],
  rules: {
    '@eslint-react/dom/no-dangerously-set-innerhtml': 'off',
    '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
    '@eslint-react/naming-convention/ref-name': 'off',
    '@eslint-react/naming-convention/use-state': 'off',
    '@eslint-react/no-unnecessary-use-callback': 'off',
    '@eslint-react/no-unused-props': 'off',
    '@eslint-react/no-unstable-context-value': 'off',
    '@eslint-react/prefer-use-state-lazy-initialization': 'off',
    '@next/next/no-img-element': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-misused-spread': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/require-await': 'off',
    'better-tailwindcss/no-unknown-classes': 'off',
    'import/exports-last': 'off',
    'import/no-unassigned-import': 'off',
    'jsx-a11y/prefer-tag-over-role': 'off',
    'lazyconvex/no-unprotected-mutation': 'off',
    'lazyconvex/require-rate-limit': 'off',
    'logical-assignment-operators': 'off',
    'max-depth': 'off',
    'no-console': 'off',
    'no-magic-numbers': 'off',
    'prefer-named-capture-group': 'off',
    'promise/param-names': 'off',
    'react/hook-use-state': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
    'react-hooks/set-state-in-effect': 'off',
    'react/no-unstable-nested-components': 'off',
    'react/no-danger': 'off',
    'react-perf/jsx-no-jsx-as-prop': 'off',
    'react-perf/jsx-no-new-array-as-prop': 'off',
    'react-perf/jsx-no-new-object-as-prop': 'off',
    'react/jsx-handler-names': 'off',
    'sort-keys': 'off',
    'unicorn/no-await-expression-member': 'off',
    'unicorn/no-document-cookie': 'off'
  },
  tailwind: 'packages/ui/src/styles/globals.css'
})
