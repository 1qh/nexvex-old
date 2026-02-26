import type { Identifier, MemberExpression } from 'estree'

import { defineConfig } from 'eslint/config'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

let cached: string[] | undefined

const getModules = (root: string): string[] => {
    if (cached) return cached
    const candidates = ['convex', 'packages/be/convex']
    for (const rel of candidates) {
      const dir = join(root, rel)
      if (existsSync(join(dir, '_generated'))) {
        const result: string[] = []
        for (const entry of readdirSync(dir))
          if (entry.endsWith('.ts') && !entry.startsWith('_') && !entry.includes('.test.') && !entry.includes('.config.'))
            result.push(entry.slice(0, -3))
        cached = result
        return result
      }
    }
    return []
  },
  convexApiCasing = {
    create: (context: {
      cwd: string
      report: (d: { data: Record<string, string>; messageId: string; node: Identifier }) => void
    }) => {
      const modules = getModules(context.cwd)
      if (modules.length === 0) return {}
      const lowerMap = new Map<string, string>()
      for (const m of modules) lowerMap.set(m.toLowerCase(), m)
      return {
        MemberExpression: (node: MemberExpression) => {
          const obj = node.object
          if (obj.type !== 'MemberExpression') return
          const parent = obj
          if (parent.object.type !== 'Identifier' || parent.object.name !== 'api') return
          if (parent.property.type !== 'Identifier') return
          const prop = parent.property
          if (modules.includes(prop.name)) return
          const suggestion = lowerMap.get(prop.name.toLowerCase())
          context.report({
            data: suggestion ? { suggestion, used: prop.name } : { used: prop.name },
            messageId: suggestion ? 'casingMismatch' : 'unknownModule',
            node: prop
          })
        }
      }
    },
    meta: {
      messages: {
        casingMismatch: 'api.{{used}} \u2014 wrong casing. Use api.{{suggestion}} to match the convex/ filename.',
        unknownModule: 'api.{{used}} \u2014 no matching file in convex/.'
      },
      type: 'problem' as const
    }
  }

export default defineConfig({
  files: ['**/*.ts', '**/*.tsx'],
  plugins: {
    convex: {
      rules: {
        'api-casing': convexApiCasing
      }
    }
  },
  rules: {
    'convex/api-casing': 'error'
  }
})
