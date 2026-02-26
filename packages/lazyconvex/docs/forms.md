# Typesafe Forms

Forms are auto-generated from your Zod schema. Field components (`Text`, `Num`, `Choose`, `Toggle`, `File`, `Files`, `Arr`, `Datepick`, `Combobox`, etc.) are type-checked — `name='titl'` is a compile error.

> [Real example: apps/blog/src/app/common.tsx — Create dialog](https://github.com/1qh/lazyconvex/blob/main/apps/blog/src/app/common.tsx)

```tsx
const form = useForm({
  schema: createBlog,
  onSubmit: async d => { await create({ ...d, published: false }); return d },
  onSuccess: () => toast.success('Created'),
})

<Form form={form} render={({ Text, Choose, File, Files, Arr, Submit }) => (
  <>
    <Text name='title' label='Title' />
    <Choose name='category' label='Category' />
    <Text name='content' label='Content' multiline />
    <File name='coverImage' label='Cover Image' accept='image/*' />
    <Files name='attachments' label='Attachments' />
    <Arr name='tags' label='Tags' transform={s => s.toLowerCase()} />
    <Submit>Create</Submit>
  </>
)} />
```

## Edit Forms with `useFormMutation`

> [Real example: apps/org/src/app/wiki/\[wikiId\]/edit/page.tsx](https://github.com/1qh/lazyconvex/blob/main/apps/org/src/app/wiki/%5BwikiId%5D/edit/page.tsx)

```tsx
const form = useFormMutation({
  mutation: api.wiki.update,
  schema: orgScoped.wiki,
  values: wiki ? pickValues(orgScoped.wiki, wiki) : undefined,
  transform: d => ({ ...d, id: wikiId, orgId: org._id }),
  onSuccess: () => toast.success('Updated'),
})
```

`pickValues` extracts schema-matching fields from an existing doc. Empty optional strings auto-coerce to `undefined`.

## Conflict Detection

```tsx
onSubmit: d => update({ id, ...d, expectedUpdatedAt: doc?.updatedAt })
```

If another user edited the record, a conflict dialog appears with Cancel / Reload / Overwrite options.

## Auto-save

```tsx
const form = useForm({
  schema: owned.blog,
  onSubmit: d => update({ id, ...d }),
  autoSave: { enabled: true, debounceMs: 1000 }
})
<AutoSaveIndicator lastSaved={form.lastSaved} />
```

## Async Validation

```tsx
export const isSlugAvailable = uniqueCheck(orgScoped.wiki, 'wiki', 'slug')

<Text name='slug' asyncValidate={async v => {
  const ok = await isSlugAvailable({ value: v, exclude: id })
  return ok ? undefined : 'Slug already taken'
}} asyncDebounceMs={500} />
```

## Multi-Step Forms

`defineSteps` creates a typed multi-step form wizard with per-step validation, step navigation, and a built-in navigation guard. Each step gets its own Zod schema and isolated typed fields.

> [Real example: apps/org/src/app/onboarding/page.tsx](https://github.com/1qh/lazyconvex/blob/main/apps/org/src/app/onboarding/page.tsx)

```tsx
import { defineSteps } from 'lazyconvex/components'

const { StepForm, useStepper } = defineSteps(
  { id: 'profile', label: 'Profile', schema: profileStep },
  { id: 'org', label: 'Organization', schema: orgStep },
  { id: 'appearance', label: 'Appearance', schema: appearanceStep },
  { id: 'preferences', label: 'Preferences', schema: preferencesStep }
)
```

Wire up submit logic:

```tsx
const stepper = useStepper({
  onSubmit: async d => {
    await upsert({ ...d.profile, ...d.preferences })
    await create({ name: d.org.name, slug: d.org.slug })
  },
  onSuccess: () => toast.success('Done!'),
  values: existingData ? { profile: { ... }, preferences: { ... } } : undefined
})
```

Render with type-isolated fields per step:

```tsx
<StepForm stepper={stepper} submitLabel='Complete'>
  <StepForm.Step id='profile' render={({ Text, File }) => (
    <>
      <Text name='displayName' label='Name' />
      <File name='avatar' label='Avatar' accept='image/*' />
    </>
  )} />
  <StepForm.Step id='org' render={({ Text }) => (
    <>
      <Text name='name' label='Org Name' />
      <Text name='slug' label='URL Slug' />
    </>
  )} />
</StepForm>
```

Features:

- Per-step Zod validation — each step validates independently before advancing
- Type-isolated fields — `name='displayName'` compiles on the profile step but errors on the org step
- Navigation guard — warns on unsaved changes, auto-disables after successful submit
- Step indicators with clickable navigation (previous steps only)
- Supports all field types: `Text`, `Num`, `Choose`, `Toggle`, `File`, `Files`, `Arr`, etc.

## Optimistic Mutations

> [Real example: apps/blog/src/app/common.tsx — Delete component](https://github.com/1qh/lazyconvex/blob/main/apps/blog/src/app/common.tsx)

```tsx
const { execute, isPending } = useOptimisticMutation({
  mutation: api.blog.rm,
  onOptimistic: () => onOptimisticRemove?.(),
  onRollback: () => toast.error('Failed to delete'),
  onSuccess: () => toast.success('Deleted'),
})
```
