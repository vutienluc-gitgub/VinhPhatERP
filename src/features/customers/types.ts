export type Customer = {
  id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  tax_code: string | null
  contact_person: string | null
  source: 'referral' | 'exhibition' | 'zalo' | 'facebook' | 'online' | 'direct' | 'cold_call' | 'other'
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type CustomersFilter = {
  query?: string
  status?: 'active' | 'inactive'
}
