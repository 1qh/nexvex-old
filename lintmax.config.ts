import { defineConfig } from 'lintmax'

export default defineConfig({
  biome: {
    ignorePatterns: ['mobile/maestro', 'tooling/eslint'],
    overrides: [
      {
        disableLinter: true,
        includes: ['packages/ui/**']
      },
      {
        includes: ['**/e2e/**', '**/maestro/**'],
        rules: {
          'performance/noAwaitInLoops': 'off',
          'suspicious/noEmptyBlockStatements': 'off'
        }
      }
    ],
    rules: {
      'a11y/useSemanticElements': 'off',
      'correctness/useExhaustiveDependencies': 'off',
      'correctness/useImageSize': 'off',
      'correctness/useUniqueElementIds': 'off',
      'nursery/noFloatingPromises': 'off',
      'nursery/noLeakedRender': 'off',
      'nursery/noUnnecessaryConditions': 'off',
      'nursery/useAwaitThenable': 'off',
      'nursery/useErrorCause': 'off',
      'nursery/useGlobalThis': 'off',
      'nursery/useNamedCaptureGroup': 'off',
      'performance/noImgElement': 'off',
      'security/noDangerouslySetInnerHtml': 'off',
      'style/noProcessEnv': 'off',
      'style/useExplicitLengthCheck': 'off',
      'style/useExportsLast': 'off',
      'suspicious/noDocumentCookie': 'off',
      'suspicious/useAwait': 'off'
    }
  },
  oxlint: {
    ignorePatterns: ['_generated/', 'mobile/maestro/', 'packages/ui/', 'tooling/eslint'],
    rules: {
      'import/exports-last': 'off',
      'import/no-unassigned-import': 'off',
      'jsx-a11y/prefer-tag-over-role': 'off',
      'max-depth': 'off',
      'nextjs/no-img-element': 'off',
      'no-empty-function': 'off',
      'promise/param-names': 'off',
      'react-perf/jsx-no-jsx-as-prop': 'off',
      'react-perf/jsx-no-new-array-as-prop': 'off',
      'react-perf/jsx-no-new-object-as-prop': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/jsx-handler-names': 'off',
      'react/no-danger': 'off',
      'sort-keys': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-document-cookie': 'off'
    },
    overrides: [
      {
        files: ['**/convex/blogProfile.ts', '**/convex/mobileAi.ts', '**/convex/orgProfile.ts'],
        rules: {
          'unicorn/filename-case': 'off'
        }
      }
    ]
  }
})
