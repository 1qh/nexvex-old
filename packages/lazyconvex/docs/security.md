# Security & Scalability

## How Convex Security Works

Convex runs all query and mutation functions on the server.
Clients call named functions and receive results — they never touch the database
directly.
There’s no client-side query language to bypass, no network-accessible DB port,
no way to craft a raw query from the browser.

Every security check in lazyconvex runs inside these server functions.
If a check fails, the function throws before any data is read or written.
The client gets an error code, nothing else.

## Auth Enforcement

Every factory (`crud`, `orgCrud`, `childCrud`, `singletonCrud`) wires auth through
`@convex-dev/auth`’s `getAuthUserId`. The `m` (authenticated mutation) and `q`
(authenticated query) builders call `getAuthUserId` on every invocation and throw
`NOT_AUTHENTICATED` if no session exists.

```ts
const { crud, orgCrud, m, q } = setup({
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  getAuthUserId
})
```

The `pq` builder (public query) skips auth — it’s for endpoints that genuinely need no
login. All write endpoints (`create`, `update`, `rm`, `bulkCreate`, `bulkUpdate`,
`bulkRm`) use `m` exclusively.
There’s no way to call a write endpoint without a valid session.

## Access Control

### pub vs auth Read Endpoints

Every `crud()` call generates two read APIs: `pub` (no auth required) and `auth`
(requires login). Both have identical shape — `list`, `read`, and optionally `search`.

```ts
const { pub, auth, create, update, rm } = crud('blog', owned.blog)

export const { list, read } = pub
export const { list, read } = auth
```

Switch access control by changing one destructure.
No endpoint rewriting needed.

Default where clauses can be set per-factory to restrict what each tier sees:

```ts
const { pub, auth } = crud('blog', owned.blog, {
  pub: { where: { published: true } },
  auth: { where: { own: true } }
})
```

### Ownership Enforcement

| Table type  | Who can create         | Who can update/delete          |
| ----------- | ---------------------- | ------------------------------ |
| `owned`     | Any authenticated user | Row owner only                 |
| `orgScoped` | Org members only       | Row owner, org admin, or owner |
| `children`  | Parent row owner only  | Parent row owner only          |
| `singleton` | Any authenticated user | Owner only (1:1 per user)      |

The `m` builder’s `get` helper enforces ownership on every read-before-write:

```ts
get: async id => {
  const d = await db.get(id)
  return d && d.userId === user._id ? d : err('NOT_FOUND')
}
```

A user who doesn’t own a row gets `NOT_FOUND`, not `FORBIDDEN`. This prevents
enumeration — callers can’t distinguish “doesn’t exist” from “exists but not yours”.

### Conflict Detection

Update endpoints accept an optional `expectedUpdatedAt` parameter.
If the row was modified since the client last read it, the update throws `CONFLICT`.
This prevents lost-update races in collaborative editing without requiring transactions.

## Organization Security

### Membership Checks

Every `orgCrud` endpoint calls `requireOrgMember` before doing anything:

```ts
await requireOrgMember({ db, orgId, userId })
```

This fetches the org and the `orgMember` row, computes the caller’s role, and throws
`NOT_ORG_MEMBER` if they’re not in the org.
The check runs on every `list`, `read`, `create`, `update`, and `rm` call — there’s no
way to skip it.

### Roles

| Role     | Permissions                                                      |
| -------- | ---------------------------------------------------------------- |
| `owner`  | All permissions. Transfer ownership. Delete org.                 |
| `admin`  | Manage members. Invite/remove. Approve join requests. Full CRUD. |
| `member` | CRUD own resources within the org. Leave org.                    |

Role levels are compared numerically (`owner: 3`, `admin: 2`, `member: 1`). Bulk
operations (`bulkUpdate`, `bulkRm`) require at least `admin`.

### Editor ACL

For per-item permissions beyond role-based access, enable `acl: true` on `orgCrud`:

```ts
orgCrud('wiki', orgScoped.wiki, { acl: true, softDelete: true })
```

This generates `addEditor`, `removeEditor`, `setEditors`, and `editors` endpoints.
The `editors` field stores an array of user IDs.
The `canEdit` check runs on every update and delete:

```ts
canEdit({ acl: true, doc, role, userId })
```

Owners and admins can always edit.
Members can edit their own rows.
If `acl: true`, members listed in `editors` can also edit.
Adding an editor requires `admin` role and verifies the target is an org member — you
can’t grant access to outsiders.

### Cascade Delete

When an org is deleted, all rows in configured cascade tables are deleted first:

```ts
setup({
  orgCascadeTables: [
    'project',
    'wiki',
    { table: 'attachment', fileFields: ['fileId'] }
  ]
})
```

File fields are cleaned from storage before rows are deleted.
Members, invites, and join requests are also purged.
The org document is deleted last.

### Membership Flow

- **Invite**: admin/owner sends invite by email, recipient accepts with a token
- **Join request**: user requests to join, admin/owner approves or rejects
- **Leave**: any member can leave (except sole owner, who must transfer first)
- **Remove**: admin can remove members, owner can remove admins

Invite tokens are generated with `crypto.getRandomValues()` — 24 random bytes encoded as
a 32-character base-36 string.
No `Math.random()`, no `Date.now()`.

## Rate Limiting

Built-in sliding window rate limiting on mutations:

```ts
crud('blog', owned.blog, { rateLimit: { max: 10, window: 60_000 } })
orgCrud('wiki', orgScoped.wiki, { rateLimit: { max: 5, window: 30_000 } })
```

`max` requests per `window` (ms) per authenticated user per table.
Uses a single-row counter in the `rateLimit` table — no write amplification.
When the window expires, the counter resets.
Exceeding the limit throws `RATE_LIMITED` with a `retryAfter` value in milliseconds.

Requires `...rateLimitTable()` in your Convex schema.

Rate limiting is skipped in test mode so tests don’t need to mock it.

## Input Sanitization

The `inputSanitize` middleware strips dangerous content from every string field before
any database write. It runs on `beforeCreate` and `beforeUpdate`.

| Attack vector           | Pattern removed                                                             |
| ----------------------- | --------------------------------------------------------------------------- |
| Script injection        | `<script>...</script>` tags                                                 |
| Event handler injection | `onclick=`, `onerror=`, any `on*=` attributes                               |
| Protocol-based XSS      | `javascript:` protocol in URLs                                              |
| Data URI injection      | `data:text/html` URIs                                                       |
| Dangerous HTML elements | `<iframe>`, `<object>`, `<embed>`, `<applet>`, `<form>`, `<base>`, `<meta>` |
| HTML entity obfuscation | Encoded angle brackets (`&#x3c;`, `&#60;`, `&#x3e;`, `&#62;`)               |

Sanitization applies to all string values by default.
Pass `fields` to target specific fields only:

```ts
inputSanitize({ fields: ['title', 'content'] })
```

## Middleware System

Middleware is a composable security pipeline that runs around every CRUD operation.
Configure it once in `setup()` and it applies to all factories:

```ts
import { auditLog, inputSanitize, slowQueryWarn } from 'lazyconvex/server'

const { crud, orgCrud } = setup({
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
  getAuthUserId,
  middleware: [
    inputSanitize(),
    auditLog({ logLevel: 'info', verbose: true }),
    slowQueryWarn({ threshold: 300 })
  ]
})
```

### Built-in Middleware

**`inputSanitize(opts?)`** — strips XSS patterns from string fields on create and
update. Runs before the write.

**`auditLog(opts?)`** — logs every create, update, and delete with `userId`, `table`,
and `id`. Set `verbose: true` to include the data payload.
Runs after the write.

**`slowQueryWarn(opts?)`** — measures time between `beforeCreate`/`beforeUpdate`/
`beforeDelete` and their `after*` counterparts.
Logs a warning when the operation exceeds `threshold` ms (default: 500ms).

### Custom Middleware

```ts
import type { Middleware } from 'lazyconvex/server'

const notifyOnCreate: Middleware = {
  name: 'notifyOnCreate',
  afterCreate: async (ctx, { id }) => {
    await sendWebhook({ table: ctx.table, id, userId: ctx.userId })
  }
}

setup({ middleware: [inputSanitize(), notifyOnCreate] })
```

Middleware can also be applied per-table via `hooks` on individual factories, which
compose with global middleware.

## Error Codes

All lazyconvex errors use discriminated `ConvexError` with a structured `code` field:

| Code                    | Meaning                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `NOT_AUTHENTICATED`     | No session — user not logged in                              |
| `NOT_FOUND`             | Row doesn’t exist or caller lacks access                     |
| `FORBIDDEN`             | Caller lacks permission (non-owner write, insufficient role) |
| `NOT_ORG_MEMBER`        | Caller is not a member of the org                            |
| `INSUFFICIENT_ORG_ROLE` | Caller’s role is below the required minimum                  |
| `EDITOR_REQUIRED`       | ACL check failed — caller not in editors list                |
| `VALIDATION_FAILED`     | Input failed Zod validation — includes field-level errors    |
| `CONFLICT`              | Row was modified since `expectedUpdatedAt`                   |
| `RATE_LIMITED`          | Too many mutations — includes `retryAfter` (ms)              |
| `LIMIT_EXCEEDED`        | Bulk operation exceeds 100-item cap                          |

On the client, use `matchError`, `getErrorCode`, or `handleConvexError` to handle these
by code:

```ts
import { matchError } from 'lazyconvex/server'

const msg = matchError(error, {
  NOT_FOUND: () => 'Item not found',
  RATE_LIMITED: d => `Slow down — retry in ${d.retryAfter}ms`,
  _: () => 'Something went wrong'
})
```

## Scalability Guidance

### Indexed Queries

Where clauses (`$gt`, `$lt`, `$between`, `or`) use Convex’s `.filter()` — they scan all
rows then filter in memory.
This works fine up to ~1,000 documents per table.

| Query pattern                | Uses index?         | Scales to   |
| ---------------------------- | ------------------- | ----------- |
| `{ own: true }`              | Yes (`by_user`)     | Millions    |
| `{ category: 'tech' }`       | No (runtime filter) | ~1,000 docs |
| `{ price: { $gte: 100 } }`   | No (runtime filter) | ~1,000 docs |
| `pubIndexed` / `authIndexed` | Yes (custom index)  | Millions    |

For high-volume tables, add Convex indexes and use `pubIndexed`/`authIndexed`:

```ts
blog: ownedTable(owned.blog).index('by_category', ['category'])

const techPosts = useQuery(api.blog.pubIndexed, {
  index: 'by_category',
  key: 'category',
  value: 'tech'
})
```

Enable `strictFilter: true` in `setup()` to throw instead of warn when a filter set
exceeds 1,000 docs. Recommended in production.

### Pagination

Always paginate. Never call `.collect()` on large tables in custom queries.

```ts
const { items, loadMore, isDone } = useList(api.blog.list, {
  where: { own: true }
})
```

Start with small page sizes (`numItems: 20`). `useList` handles cursor management and
`loadMore` automatically.

### Soft Delete vs Hard Delete

Soft delete (`softDelete: true`) sets `deletedAt` instead of removing the row.
This gives users an undo window and preserves audit history.
Hard delete is the default and removes the row immediately, cleaning up any associated
storage files.

For org-scoped tables, soft delete filters out deleted rows from `list` queries
automatically. The `restore` endpoint is generated when `softDelete: true`.

### `warnLargeFilterSet`

Use `warnLargeFilterSet` in custom queries to catch unbounded data patterns during
development:

```ts
import { warnLargeFilterSet } from 'lazyconvex/server'

const docs = await ctx.db.query('post').collect()
warnLargeFilterSet(docs.length, 'post', 'home-feed')
warnLargeFilterSet(docs.length, 'post', 'home-feed', true)
```

The fourth argument enables strict mode — throws instead of warns.

## Anti-Patterns

**Exporting `pub` endpoints for data that should require login.** `pub` uses `pq` which
skips `getAuthUserId`. If the data is user-specific, export `auth` instead.

**Skipping `requireOrgMember` in custom org queries.** If you write a custom `q`
endpoint that reads org data, call `requireOrgMember` yourself.
The factory does it automatically; custom functions don’t.

**Using `.collect()` on large tables.** Convex loads all matching rows into memory.
Use `.paginate()` or index-based queries for tables that grow unboundedly.

**Storing unbounded data without pagination or TTL.** Tables that grow forever slow down
queries proportionally.
Add pagination to reads and consider archiving or deleting old rows on a schedule.

**Client-side access control.** Don’t hide UI elements and call it security.
The server function is the only enforcement point.
A user who calls the mutation directly bypasses any client-side check.

**Passing user IDs from the client.** The `m` builder injects `user._id` from the
server-side session.
Never accept a `userId` argument from the client for ownership purposes — always use
`c.user._id`.
