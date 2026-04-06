export type FabricCatalogStatus = 'active' | 'inactive'

export type FabricCatalog = {
  id: string
  code: string
  name: string
  composition: string | null
  unit: string
  notes: string | null
  status: FabricCatalogStatus
  created_at: string
  updated_at: string
}

export type FabricCatalogFilter = {
  search?: string
  status?: FabricCatalogStatus
}
