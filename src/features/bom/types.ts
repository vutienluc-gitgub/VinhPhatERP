import { Database } from '@/services/supabase/database.types';

export type BomStatus = Database['public']['Enums']['bom_status'];

export type BomTemplate =
  Database['public']['Tables']['bom_templates']['Row'] & {
    // Related lists for details
    bom_yarn_items?: BomYarnItem[];
    fabric_catalogs?: {
      code: string;
      name: string;
      composition: string | null;
    } | null;
    created_by_profile?: { full_name: string | null } | null;
    approved_by_profile?: { full_name: string | null } | null;
  };

export type BomYarnItem =
  Database['public']['Tables']['bom_yarn_items']['Row'] & {
    yarn_catalogs?: {
      code: string;
      name: string;
      composition: string | null;
      unit: string;
    } | null;
  };

export type BomVersion = Database['public']['Tables']['bom_versions']['Row'] & {
  created_by_profile?: { full_name: string | null } | null;
};

export type FabricCatalog =
  Database['public']['Tables']['fabric_catalogs']['Row'];

export interface BomFilter {
  search?: string;
  status?: BomStatus;
}
