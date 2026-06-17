export type LeadType = 'RFQ' | 'SAMPLE' | 'CONTACT';
export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'SAMPLE_SENT'
  | 'QUOTED'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST';
export type ActivityType =
  | 'CALL'
  | 'NOTE'
  | 'EMAIL'
  | 'SAMPLE'
  | 'QUOTE'
  | 'ORDER'
  | 'SYSTEM';

export interface CrmLead {
  id: string;
  type: LeadType;
  customer_name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  status: LeadStatus;
  score: number;
  owner_id: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;

  // Relations (optional/joined)
  rfq_detail?: CrmRfqDetail;
  sample_detail?: CrmSampleDetail;
  activities?: CrmActivity[];
}

export interface CrmRfqDetail {
  id: string;
  lead_id: string;
  fabric_catalog_id: string;
  variant_id: string | null;
  quantity: number;
  unit: string;
  target_price: number | null;
  target_delivery_date: string | null;
  created_at: string;
  updated_at: string;

  // Joined relation for UI display
  fabric_catalog?: {
    code: string;
    name: string;
  };
  variant?: {
    code: string;
    color_name: string;
  };
}

export interface CrmSampleDetail {
  id: string;
  lead_id: string;
  fabric_catalog_id: string;
  delivery_address: string;
  selected_variants: Array<{ variant_code: string; color_name: string }>;
  created_at: string;
  updated_at: string;

  // Joined relation for UI display
  fabric_catalog?: {
    code: string;
    name: string;
  };
}

export interface CrmActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  description: string;
  owner_id: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;

  owner?: {
    id: string;
    full_name: string;
  };
}

export interface LeadFilter {
  type?: LeadType;
  status?: LeadStatus;
  search?: string;
}
