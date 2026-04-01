# File Templates — Feature Scaffold

Thay `<featureName>` = kebab-case (yarn-receipts), `<EntityName>` = PascalCase (YarnReceipt), `<tableName>` = snake_case (yarn_receipts).

---

## types.ts

```ts
export type <EntityName> = {
  id: string
  // --- thêm các trường domain ở đây ---
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type <EntityName>Filter = {
  query?: string
  status?: 'active' | 'inactive'
}
```

---

## \<featureName\>.module.ts

```ts
import { z } from 'zod'
import type { FeatureDefinition } from '@/shared/types/feature'

export const <featureName>Schema = z.object({
  // --- các trường bắt buộc ---
  name: z.string().trim().min(2, 'Tên tối thiểu 2 ký tự'),
  // --- các trường tuỳ chọn ---
  notes: z.string().trim().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
})

export type <EntityName>FormValues = z.infer<typeof <featureName>Schema>

export const <featureName>DefaultValues: <EntityName>FormValues = {
  name: '',
  notes: '',
  status: 'active',
}

export const <featureName>Feature: FeatureDefinition = {
  key: '<featureName>',
  route: '/<featureName>',
  title: '<Tiêu đề hiển thị>',
  badge: 'Scaffolded',
  description: '<Mô tả ngắn module>',
  highlights: [],
  resources: [],
  entities: ['<EntityName>'],
  nextMilestones: [],
}
```

---

## use\<EntityName\>s.ts

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { <EntityName>FormValues } from './<featureName>.module'
import type { <EntityName>, <EntityName>Filter } from './types'

const TABLE = '<tableName>'
const QUERY_KEY = ['<featureName>'] as const

function toDbRow(values: <EntityName>FormValues): Omit<<EntityName>, 'id' | 'created_at' | 'updated_at'> {
  return {
    ...values,
    name: values.name.trim(),
    notes: values.notes?.trim() || null,
  }
}

export function use<EntityName>List(filters: <EntityName>Filter = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async () => {
      let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false })
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.query?.trim()) {
        const q = filters.query.trim()
        query = query.ilike('name', `%${q}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as <EntityName>[]
    },
  })
}

export function useCreate<EntityName>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: <EntityName>FormValues) => {
      const { data, error } = await supabase.from(TABLE).insert([toDbRow(values)]).select().single()
      if (error) throw error
      return data as <EntityName>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdate<EntityName>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: <EntityName>FormValues }) => {
      const { data, error } = await supabase.from(TABLE).update(toDbRow(values)).eq('id', id).select().single()
      if (error) throw error
      return data as <EntityName>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDelete<EntityName>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
```

---

## \<EntityName\>Form.tsx

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { <featureName>Schema, <featureName>DefaultValues } from './<featureName>.module'
import type { <EntityName>FormValues } from './<featureName>.module'
import type { <EntityName> } from './types'
import { useCreate<EntityName>, useUpdate<EntityName> } from './use<EntityName>s'

type Props = {
  item: <EntityName> | null
  onClose: () => void
}

export function <EntityName>Form({ item, onClose }: Props) {
  const create = useCreate<EntityName>()
  const update = useUpdate<EntityName>()

  const form = useForm<<EntityName>FormValues>({
    resolver: zodResolver(<featureName>Schema),
    defaultValues: item
      ? { name: item.name, notes: item.notes ?? '', status: item.status }
      : <featureName>DefaultValues,
  })

  async function onSubmit(values: <EntityName>FormValues) {
    if (item) {
      await update.mutateAsync({ id: item.id, values })
    } else {
      await create.mutateAsync(values)
    }
    onClose()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* TODO: thêm các trường form */}
      <button type="submit" disabled={form.formState.isSubmitting}>
        {item ? 'Cập nhật' : 'Tạo mới'}
      </button>
    </form>
  )
}
```

---

## \<EntityName\>List.tsx

```tsx
import { useState } from 'react'
import { use<EntityName>List } from './use<EntityName>s'
import type { <EntityName> } from './types'

type Props = {
  onEdit: (item: <EntityName>) => void
  onNew: () => void
}

export function <EntityName>List({ onEdit, onNew }: Props) {
  const [query, setQuery] = useState('')
  const { data, isLoading, error } = use<EntityName>List({ query })

  if (isLoading) return <div>Đang tải...</div>
  if (error) return <div>Lỗi tải dữ liệu</div>

  return (
    <div>
      <div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm..." />
        <button onClick={onNew}>+ Thêm mới</button>
      </div>
      {data?.length === 0 && <div>Chưa có dữ liệu</div>}
      <ul>
        {data?.map(item => (
          <li key={item.id}>
            {item.name}
            <button onClick={() => onEdit(item)}>Sửa</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## \<EntityName\>Page.tsx

```tsx
import { useState } from 'react'
import { <EntityName>Form } from './<EntityName>Form'
import { <EntityName>List } from './<EntityName>List'
import type { <EntityName> } from './types'

export function <EntityName>Page() {
  const [editItem, setEditItem] = useState<<EntityName> | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditItem(null)
    setShowForm(true)
  }

  function openEdit(item: <EntityName>) {
    setEditItem(item)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditItem(null)
  }

  return (
    <>
      <<EntityName>List onEdit={openEdit} onNew={openCreate} />
      {showForm && <<EntityName>Form item={editItem} onClose={closeForm} />}
    </>
  )
}
```

---

## index.ts

```ts
export * from "./<featureName>.module";
export * from "./types";
export * from "./use<EntityName>s";
export * from "./<EntityName>Form";
export * from "./<EntityName>List";
export * from "./<EntityName>Page";
```

---

## Thêm route (trong AppRouter.tsx hoặc routes.tsx)

```tsx
const <EntityName>Page = lazy(() => import('@/features/<featureName>').then(m => ({ default: m.<EntityName>Page })))

// trong Routes:
<Route path="/<featureName>" element={<Suspense fallback={<div>Đang tải...</div>}><ProtectedRoute><EntityName>Page /></ProtectedRoute></Suspense>} />
```
