#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SCHEMA_TS = `import { ownedTable, rateLimitTable, uploadTables } from 'lazyconvex/server'
import { defineSchema } from 'convex/server'
import { owned } from './t'

export default defineSchema({
  ...uploadTables(),
  ...rateLimitTable(),
  blog: ownedTable(owned.blog)
})
`,
  T_TS = `import { cvFile, makeOwned } from 'lazyconvex/schema'
import { boolean, object, string, enum as zenum } from 'zod/v4'

const owned = makeOwned({
  blog: object({
    title: string().min(1),
    content: string(),
    category: zenum(['tech', 'life', 'tutorial']),
    published: boolean(),
    coverImage: cvFile().nullable().optional()
  })
})

export { owned }
`,
  LAZY_TS = `import { getAuthUserId } from '@convex-dev/auth/server'
import { setup } from 'lazyconvex/server'

import { action, internalMutation, internalQuery, mutation, query } from './_generated/server'

const { crud, pq, q, m } = setup({
  action,
  getAuthUserId: getAuthUserId as (ctx: unknown) => Promise<null | string>,
  internalMutation,
  internalQuery,
  mutation,
  query
})

export { crud, m, pq, q }
`,
  BLOG_TS = `import { crud } from './lazy'
import { owned } from './t'

export const {
  create, list, read, rm, update
} = crud('blog', owned.blog)
`,
  PROVIDER_TSX = `'use client'
import type { ReactNode } from 'react'

import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import { ConvexErrorBoundary } from 'lazyconvex/components'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? '')

const ConvexProvider = ({ children }: { children: ReactNode }) => (
  <ConvexErrorBoundary>
    <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
  </ConvexErrorBoundary>
)

export default ConvexProvider
`,
  LAYOUT_TSX = `import type { ReactNode } from 'react'

import ConvexProvider from './convex-provider'

import './globals.css'

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang='en'>
    <body>
      <ConvexProvider>{children}</ConvexProvider>
    </body>
  </html>
)

export default RootLayout
`,
  PAGE_TSX = `'use client'
import { useMutation } from 'convex/react'
import { useList } from 'lazyconvex/react'
import { useState } from 'react'

import { api } from '../../convex/_generated/api'

const BlogPage = () => {
  const { items, loadMore, status } = useList(api.blog.list)
  const createBlog = useMutation(api.blog.create)
  const [title, setTitle] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) return
    await createBlog({ title, content: '', category: 'tech', published: false })
    setTitle('')
  }

  return (
    <main className='mx-auto max-w-2xl p-8'>
      <h1 className='mb-6 text-2xl font-bold'>Blog</h1>
      <div className='mb-6 flex gap-2'>
        <input
          className='flex-1 rounded border px-3 py-2'
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder='New post title...'
          value={title}
        />
        <button
          className='rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700'
          onClick={handleCreate}
          type='button'>
          Create
        </button>
      </div>
      <ul className='divide-y'>
        {items.map(b => (
          <li className='py-3' key={b._id}>
            <span className='font-medium'>{b.title}</span>
            <span className='ml-2 text-sm text-zinc-500'>{b.category}</span>
          </li>
        ))}
      </ul>
      {status === 'CanLoadMore' && (
        <button className='mt-4 text-sm text-zinc-500 hover:text-zinc-900' onClick={loadMore} type='button'>
          Load more
        </button>
      )}
      {items.length === 0 && <p className='text-zinc-400'>No posts yet. Create one above.</p>}
    </main>
  )
}

export default BlogPage
`,
  BACKEND_FILES: [string, string][] = [
    ['schema.ts', SCHEMA_TS],
    ['t.ts', T_TS],
    ['lazy.ts', LAZY_TS],
    ['blog.ts', BLOG_TS]
  ],
  FRONTEND_FILES: [string, string][] = [
    ['convex-provider.tsx', PROVIDER_TSX],
    ['layout.tsx', LAYOUT_TSX],
    ['page.tsx', PAGE_TSX]
  ],
  writeOneFile = ({
    absDir,
    content,
    label,
    name
  }: {
    absDir: string
    content: string
    label: string
    name: string
  }): boolean => {
    const path = join(absDir, name)
    if (existsSync(path)) {
      process.stdout.write(`  skip ${label}/${name} (exists)\n`)
      return false
    }
    writeFileSync(path, content)
    process.stdout.write(`  create ${label}/${name}\n`)
    return true
  },
  writeFilesToDir = (absDir: string, label: string, files: [string, string][]) => {
    if (!existsSync(absDir)) mkdirSync(absDir, { recursive: true })
    let created = 0,
      skipped = 0
    for (const [name, content] of files)
      if (writeOneFile({ absDir, content, label, name })) created += 1
      else skipped += 1
    return { created, skipped }
  },
  printSummary = (created: number, skipped: number) => {
    process.stdout.write('\n')
    if (created > 0) process.stdout.write(`Created ${created} file${created > 1 ? 's' : ''}.\n`)
    if (skipped > 0) process.stdout.write(`Skipped ${skipped} existing file${skipped > 1 ? 's' : ''}.\n`)
    process.stdout.write('\nNext steps:\n')
    process.stdout.write('  bun add lazyconvex convex @convex-dev/auth zod\n')
    process.stdout.write('  bunx convex dev & bun dev\n\n')
  },
  run = () => {
    const convexDir = process.argv[2] ?? 'convex',
      appDir = process.argv[3] ?? 'src/app',
      b = writeFilesToDir(join(process.cwd(), convexDir), convexDir, BACKEND_FILES),
      f = writeFilesToDir(join(process.cwd(), appDir), appDir, FRONTEND_FILES)
    printSummary(b.created + f.created, b.skipped + f.skipped)
  }

run()
