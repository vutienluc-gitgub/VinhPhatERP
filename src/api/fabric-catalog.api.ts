import { supabase } from '@/services/supabase/client'
import { DEFAULT_PAGE_SIZE } from '@/shared/types/pagination'
import type { PaginatedResult } from '@/shared/types/pagination'
import type { FabricCatalog, FabricCatalogFilter } from '@/features/fabric-catalog/types'

const TABLE = 'fabric_catalogs'

type FabricCatalogRow = Omit<FabricCatalog, 'id' | 'created_at' | 'updated_at'>

export async function fetchFabricCatalogPaginated(
  filters: FabricCatalogFilter = {},
  page = 1,
): Promise<PaginatedResult<FabricCatalog>> {
  const from = (page - 1) * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search?.trim()) {
    const q = filters.search.trim()
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,composition.ilike.%${q}%`)
  }

  const { data, error, count } = await query
  if (error) throw error
  const total = count ?? 0
  return {
    data: (data ?? []) as FabricCatalog[],
    total,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE),
  }
}

export async function fetchFabricCatalogOptions(): Promise<Pick<FabricCatalog, 'id' | 'code' | 'name' | 'composition' | 'unit'>[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, code, name, composition, unit')
    .eq('status', 'active')
    .order('name')
  if (error) throw error
  return (data ?? []) as Pick<FabricCatalog, 'id' | 'code' | 'name' | 'composition' | 'unit'>[]
}

export async function fetchNextFabricCatalogCode(): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('code')
    .ilike('code', 'FC-%')
    .order('code', { ascending: false })
    .limit(1)

  if (error) throw error
  if (!data || data.length === 0) return 'FC-001'
  const last = data[0]?.code ?? 'FC-000'
  const match = last.match(/^FC-(\d+)$/)
  if (!match) return 'FC-001'
  const nextNum = parseInt(match[1]!, 10) + 1
  return `FC-${String(nextNum).padStart(3, '0')}`
}

export async function createFabricCatalog(row: FabricCatalogRow): Promise<FabricCatalog> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as FabricCatalog
}

export async function updateFabricCatalog(id: string, row: FabricCatalogRow): Promise<FabricCatalog> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as FabricCatalog
}

export async function deleteFabricCatalog(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}
