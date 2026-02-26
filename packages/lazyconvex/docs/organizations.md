# Organizations

Full multi-tenant system with roles, invites, join requests, and per-item ACL.

## One Line for Org-Scoped CRUD

> [Real example: packages/be/convex/wiki.ts](https://github.com/1qh/lazyconvex/blob/main/packages/be/convex/wiki.ts)

```tsx
export const { addEditor, bulkRm, create, editors, list, read,
  removeEditor, restore, rm, setEditors, update
} = orgCrud('wiki', orgScoped.wiki, { acl: true, softDelete: true })
```

## ACL (Per-Item Editor Permissions)

Pass `acl: true` → get `addEditor`, `removeEditor`, `setEditors`, `editors` endpoints. Add `editors: array(zid('users')).optional()` to schema.

| Role | Can edit? |
|------|-----------|
| Org owner/admin | Always |
| Item creator | Always (own docs) |
| In `editors[]` | Yes |
| Regular member | View only |

Child tables inherit ACL from parents:

```tsx
orgCrud('task', orgScoped.task, { aclFrom: { field: 'projectId', table: 'project' } })
```

## Cascade Delete

> [Real example: packages/be/convex/project.ts](https://github.com/1qh/lazyconvex/blob/main/packages/be/convex/project.ts)

```tsx
orgCrud('project', orgScoped.project, {
  acl: true,
  cascade: orgCascade(orgScoped.task, { foreignKey: 'projectId', table: 'task' })
})
```

Both `foreignKey` and `table` are type-checked — typos are compile errors.

## Frontend Org Hooks

```tsx
const { useOrg, useActiveOrg, useMyOrgs } = createOrgHooks(api.org)

<OrgProvider membership={membership} org={org} role={role}>
  {children}
</OrgProvider>

const { org, role, isAdmin, isOwner } = useOrg()
const projects = useOrgQuery(api.project.list, { paginationOpts: { cursor: null, numItems: 20 } })
const remove = useOrgMutation(api.project.rm)
await remove({ id: projectId }) // orgId auto-injected
```

## Org API

Management: `create`, `update`, `get`, `getBySlug`, `myOrgs`, `remove`
Membership: `membership`, `members`, `setAdmin`, `removeMember`, `leave`, `transferOwnership`
Invites: `invite`, `acceptInvite`, `revokeInvite`, `pendingInvites`
Join requests: `requestJoin`, `approveJoinRequest`, `rejectJoinRequest`, `pendingJoinRequests`

## Pre-Built Components

```tsx
import { EditorsSection, PermissionGuard, OrgAvatar, RoleBadge, OfflineIndicator } from 'lazyconvex/components'
```

> [Real example: apps/org/src/app/wiki/\[wikiId\]/page.tsx — EditorsSection](https://github.com/1qh/lazyconvex/blob/main/apps/org/src/app/wiki/%5BwikiId%5D/page.tsx) | [apps/org/src/app/wiki/\[wikiId\]/edit/page.tsx — PermissionGuard + AutoSave](https://github.com/1qh/lazyconvex/blob/main/apps/org/src/app/wiki/%5BwikiId%5D/edit/page.tsx)
