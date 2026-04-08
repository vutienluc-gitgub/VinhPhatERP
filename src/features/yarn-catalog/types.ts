export type YarnCatalogStatus = 'active' | 'inactive';

export type YarnCatalog = {
  id: string;
  code: string;
  name: string;
  composition: string | null;
  color_name: string | null;
  tensile_strength: string | null;
  origin: string | null;
  unit: string;
  notes: string | null;
  status: YarnCatalogStatus;
  created_at: string;
  updated_at: string;
};

export type YarnCatalogFilter = {
  search?: string;
  status?: YarnCatalogStatus;
};
