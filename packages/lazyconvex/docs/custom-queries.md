# Custom Queries (Escape Hatches)

`setup()` returns `pq`, `q`, and `m` — thin wrappers around Convex's query/mutation builders that inject auth context and helpers. Use them when generated CRUD isn't enough.

| Builder | Auth | Context provides |
|---------|------|-----------------|
| `pq` | Optional | `viewerId` (null if anon), `withAuthor` |
| `q` | Required | `user`, `viewerId`, `withAuthor`, `get` (ownership-checked) |
| `m` | Required | `user`, `get`, `create`, `patch` (with conflict detection), `delete` |

## pq — Public Query (No Auth Required)

```tsx
const bySlug = pq({
  args: { slug: z.string() },
  handler: async (c, { slug }) => {
    const doc = await c.db.query('blog').withIndex('by_slug', q => q.eq('slug', slug)).unique()
    return doc ? (await c.withAuthor([doc]))[0] : null
  }
})
```

## q — Authenticated Query

```tsx
const listDeleted = q({
  args: { orgId: zid('org') },
  handler: async (c, { orgId }) => {
    await requireOrgMember({ db: c.db, orgId, userId: c.user._id })
    const docs = await c.db.query('wiki').filter(f => f.eq(f.field('orgId'), orgId)).order('desc').collect()
    const deleted: typeof docs = []
    for (const d of docs) if (d.deletedAt !== undefined) deleted.push(d)
    return deleted
  }
})
```

## m — Authenticated Mutation

```tsx
const archive = m({
  args: { id: z.string() },
  handler: async (c, { id }) => c.patch(id, { archived: true })
})
```

`c.patch` includes conflict detection — pass `expectedUpdatedAt` as the third argument.

## Mixing Custom and Generated Endpoints

Custom endpoints live in the same file as generated CRUD:

> [Real example: packages/be/convex/wiki.ts](https://github.com/1qh/lazyconvex/blob/main/packages/be/convex/wiki.ts)

```tsx
import { orgCrud, q, uniqueCheck } from '../lazy'
import { orgScoped } from '../t'

export const {
    addEditor, bulkRm, create, list, read, rm, update
  } = orgCrud('wiki', orgScoped.wiki, { acl: true, softDelete: true }),
  listDeleted = q({ args: { orgId: zid('org') }, handler: async (c, { orgId }) => { /* ... */ } }),
  isSlugAvailable = uniqueCheck(orgScoped.wiki, 'wiki', 'slug')
```

You can also drop to raw Convex `action`/`mutation`/`query` when you don't need lazyconvex's auth context:

> [Real example: packages/be/convex/movie.ts](https://github.com/1qh/lazyconvex/blob/main/packages/be/convex/movie.ts)

```tsx
import { action } from './_generated/server'

export const search = action({
    args: { query: v.string() },
    handler: async (_, { query }) => { /* call external API */ }
  }),
  { all, get, load, refresh } = cacheCrud({ /* ... */ })
```

## Outgrowing `crud()` — Migration to Custom Queries

The generated `where` clauses (`$gt`, `$lt`, `$between`, `or`) use runtime `.filter()` after fetching documents. This works well for tables under ~1,000 documents. When a table grows past that, you'll see the `RUNTIME_FILTER_WARN_THRESHOLD` warning in logs.

### Strict Filter Mode

Pass `strictFilter: true` to `setup()` to throw instead of warn:

```tsx
const { crud, ... } = setup({
  query, mutation, action, internalQuery, internalMutation,
  getAuthUserId,
  strictFilter: true,
})
```

### Step 1: Add a Convex Index

```tsx
blog: ownedTable(owned.blog)
  .index('by_category', ['category'])
  .index('by_published_date', ['published', '_creationTime'])
```

### Step 2: Write a Custom Query

```tsx
export const listByCategory = pq({
  args: { category: z.string(), paginationOpts: z.object({ cursor: z.string().nullable(), numItems: z.number() }) },
  handler: async (c, { category, paginationOpts }) => {
    const results = await c.db
      .query('blog')
      .withIndex('by_category', q => q.eq('category', category))
      .order('desc')
      .paginate(paginationOpts)
    return { ...results, page: await c.withAuthor(results.page) }
  }
})
```

### Step 3: Replace the Frontend Call

```tsx
// Before (runtime filtering)
const { items } = useList(api.blog.list, { where: { category: 'tech' } })

// After (index-backed)
const results = usePaginatedQuery(api.blog.listByCategory, { category: 'tech' }, { initialNumItems: 20 })
```

### What Stays, What Changes

| Concern | Generated `crud()` | Custom `pq`/`q`/`m` |
|---------|-------------------|---------------------|
| Auth + ownership | Automatic | `c.user`, `c.get(id)` |
| File cleanup | Automatic | Manual (call `storage.delete`) |
| Where clauses | Runtime `.filter()` | Convex `.withIndex()` |
| Conflict detection | `expectedUpdatedAt` | `c.patch(id, data, expectedUpdatedAt)` |
| Author enrichment | Automatic | `c.withAuthor(docs)` |
| Rate limiting | `rateLimit` option | Manual (`checkRateLimit` from `lazyconvex/server`) |

Keep generated CRUD for mutations and simple reads, add custom indexed queries only for hot paths.
