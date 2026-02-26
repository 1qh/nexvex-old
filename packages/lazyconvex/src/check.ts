#!/usr/bin/env bun
/* eslint-disable no-console, max-statements, complexity */
/** biome-ignore-all lint/style/noProcessEnv: cli */
/** biome-ignore-all lint/performance/noAwaitInLoops: sequential */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const red = (s: string) => `\u001B[31m${s}\u001B[0m`,
  green = (s: string) => `\u001B[32m${s}\u001B[0m`,
  yellow = (s: string) => `\u001B[33m${s}\u001B[0m`,
  dim = (s: string) => `\u001B[2m${s}\u001B[0m`,
  bold = (s: string) => `\u001B[1m${s}\u001B[0m`

interface Issue {
  file?: string
  level: 'error' | 'warn'
  message: string
}

const schemaMarkers = ['makeOwned(', 'makeOrgScoped(', 'makeSingleton(', 'makeBase(', 'child('],
  factoryPattern = /(?<factory>crud|orgCrud|childCrud|cacheCrud|singletonCrud)\(\s*['"](?<table>\w+)['"]/gu,
  wrapperFactories = ['makeOwned', 'makeOrgScoped', 'makeSingleton', 'makeBase'],
  isSchemaFile = (content: string): boolean => {
    for (const marker of schemaMarkers) if (content.includes(marker)) return true
    return false
  },
  hasGenerated = (dir: string): boolean => existsSync(join(dir, '_generated')),
  findConvexDir = (root: string): string | undefined => {
    const direct = join(root, 'convex')
    if (hasGenerated(direct)) return direct
    if (!existsSync(root)) return
    for (const sub of readdirSync(root, { withFileTypes: true }))
      if (sub.isDirectory()) {
        const nested = join(root, sub.name, 'convex')
        if (hasGenerated(nested)) return nested
      }
  },
  findSchemaFile = (convexDir: string): undefined | { content: string; path: string } => {
    const searchDir = dirname(convexDir)
    if (!existsSync(searchDir)) return
    for (const entry of readdirSync(searchDir))
      if (entry.endsWith('.ts') && !entry.endsWith('.test.ts') && !entry.endsWith('.config.ts')) {
        const full = join(searchDir, entry),
          content = readFileSync(full, 'utf8')
        if (isSchemaFile(content)) return { content, path: full }
      }
  },
  extractSchemaTableNames = (content: string): Set<string> => {
    const tables = new Set<string>()
    for (const factory of wrapperFactories) {
      const pat = new RegExp(`${factory}\\(\\{`, 'gu')
      let fm = pat.exec(content)
      while (fm) {
        let depth = 1,
          pos = fm.index + fm[0].length
        while (pos < content.length && depth > 0) {
          if (content[pos] === '{') depth += 1
          else if (content[pos] === '}') depth -= 1
          pos += 1
        }
        const block = content.slice(fm.index + fm[0].length, pos - 1),
          propPat = /(?<pname>\w+)\s*:\s*object\(/gu
        let pm = propPat.exec(block)
        while (pm) {
          if (pm.groups?.pname) tables.add(pm.groups.pname)
          pm = propPat.exec(block)
        }
        fm = pat.exec(content)
      }
    }
    const childPat = /(?<cname>\w+)\s*:\s*child\(/gu
    let cm = childPat.exec(content)
    while (cm) {
      if (cm.groups?.cname) tables.add(cm.groups.cname)
      cm = childPat.exec(content)
    }
    return tables
  },
  extractFactoryCalls = (
    convexDir: string
  ): { calls: { factory: string; file: string; table: string }[]; files: string[] } => {
    const calls: { factory: string; file: string; table: string }[] = [],
      files: string[] = []
    for (const entry of readdirSync(convexDir))
      if (entry.endsWith('.ts') && !entry.startsWith('_') && !entry.includes('.test.') && !entry.includes('.config.')) {
        const full = join(convexDir, entry),
          content = readFileSync(full, 'utf8')
        files.push(entry)
        let m = factoryPattern.exec(content)
        while (m) {
          if (m.groups?.factory && m.groups.table)
            calls.push({ factory: m.groups.factory, file: entry, table: m.groups.table })
          m = factoryPattern.exec(content)
        }
        factoryPattern.lastIndex = 0
      }
    return { calls, files }
  },
  run = () => {
    const root = process.cwd(),
      issues: Issue[] = []

    console.log(bold('\nlazyconvex check\n'))

    const convexDir = findConvexDir(root)
    if (!convexDir) {
      console.log(red('✗ Could not find convex/ directory with _generated/'))
      console.log(dim('  Run from project root or a directory containing convex/'))
      process.exit(1)
    }
    console.log(`${dim('convex dir:')} ${convexDir}`)

    const schemaFile = findSchemaFile(convexDir)
    if (!schemaFile) {
      console.log(red('✗ Could not find schema file with lazyconvex markers'))
      console.log(dim('  Expected a .ts file importing makeOwned/makeOrgScoped/etc.'))
      process.exit(1)
    }
    console.log(`${dim('schema:')}    ${schemaFile.path}\n`)

    const schemaTables = extractSchemaTableNames(schemaFile.content),
      { calls, files } = extractFactoryCalls(convexDir)

    console.log(`${dim('tables in schema:')} ${[...schemaTables].join(', ') || 'none'}`)
    console.log(`${dim('factory calls:')}    ${calls.length}\n`)

    const seen = new Map<string, string>()
    for (const call of calls) {
      if (seen.has(call.table))
        issues.push({
          file: call.file,
          level: 'error',
          message: `Duplicate factory for table "${call.table}" (also in ${seen.get(call.table)})`
        })
      else seen.set(call.table, call.file)

      if (!schemaTables.has(call.table))
        issues.push({
          file: call.file,
          level: 'error',
          message: `${call.factory}('${call.table}') but no "${call.table}" table found in schema`
        })
    }

    const factoryTables = new Set(calls.map(c => c.table))
    for (const table of schemaTables)
      if (!factoryTables.has(table))
        issues.push({
          file: basename(schemaFile.path),
          level: 'warn',
          message: `Table "${table}" defined in schema but no factory call found`
        })

    const convexFiles = new Set(files.map(f => f.replace('.ts', '')))
    for (const call of calls)
      if (call.table !== basename(call.file, '.ts') && !convexFiles.has(call.table))
        issues.push({
          file: call.file,
          level: 'warn',
          message: `${call.factory}('${call.table}') in ${call.file} — table name doesn't match filename`
        })

    if (!issues.length) {
      console.log(green('✓ All checks passed\n'))
      return
    }

    const errors = issues.filter(i => i.level === 'error'),
      warnings = issues.filter(i => i.level === 'warn')

    for (const issue of errors) console.log(`${red('✗')} ${issue.file ? `${dim(issue.file)} ` : ''}${issue.message}`)
    for (const issue of warnings) console.log(`${yellow('⚠')} ${issue.file ? `${dim(issue.file)} ` : ''}${issue.message}`)

    console.log(
      `\n${errors.length ? red(`${errors.length} error(s)`) : ''}${errors.length && warnings.length ? ', ' : ''}${warnings.length ? yellow(`${warnings.length} warning(s)`) : ''}\n`
    )

    if (errors.length) process.exit(1)
  }

run()
