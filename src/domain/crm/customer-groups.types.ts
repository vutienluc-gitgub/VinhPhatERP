/**
 * Customer group domain types.
 * Pure TypeScript.
 */
export interface CustomerGroup {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  tenant_id?: string | null;
}

export type CustomerGroupInsert = Omit<
  CustomerGroup,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerGroupUpdate = Partial<CustomerGroupInsert>;
