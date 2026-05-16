/**
 * Yarn-catalog domain types.
 * Pure TypeScript — no React or Supabase dependency.
 */
export type YarnCatalogStatus = 'active' | 'inactive';

export type YarnCatalog = {
  id: string;
  code: string;
  name: string;
  composition: string | null;
  color_name: string | null;
  tensile_strength: string | null;
  origin: string | null;
  lot_no: string | null;
  grade: string | null;
  category: string | null;
  yarn_type: string | null;
  denier: string | null;
  filament_count: string | null;
  finish: string | null;
  color_status: string | null;
  count_ne: string | null;
  spinning_method: string | null;
  twist_type: string | null;
  certifications: string[];
  is_fancy: boolean;
  fancy_details: string | null;
  unit: string;
  notes: string | null;
  status: YarnCatalogStatus;
  created_at: string;
  updated_at: string;
};

export type YarnCatalogFilter = {
  search?: string;
  status?: YarnCatalogStatus;
  lot_no?: string;
  grade?: string;
  category?: string;
  yarn_type?: string;
  spinning_method?: string;
};
