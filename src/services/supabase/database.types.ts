// Auto-maintained hand-written types based on supabase/migrations/0001_initial_schema.sql
// Update when schema changes.

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer'
export type ActiveStatus = 'active' | 'inactive'
export type DocStatus = 'draft' | 'confirmed' | 'cancelled'
export type OrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type ProductionStage =
  | 'warping'
  | 'weaving'
  | 'greige_check'
  | 'dyeing'
  | 'finishing'
  | 'final_check'
  | 'packing'
export type StageStatus = 'pending' | 'in_progress' | 'done' | 'skipped'
export type RollStatus = 'in_stock' | 'reserved' | 'in_process' | 'shipped' | 'damaged' | 'written_off'
export type ShipmentStatus = 'preparing' | 'shipped' | 'delivered' | 'partially_returned' | 'returned'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'other'
export type AdjustmentType = 'increase' | 'decrease' | 'correction'
export type SupplierCategory = 'yarn' | 'dye' | 'weaving' | 'accessories' | 'other'
export type CustomerSource = 'referral' | 'exhibition' | 'zalo' | 'online' | 'direct' | 'cold_call' | 'other'
export type InventoryItemType = 'yarn' | 'raw_fabric' | 'finished_fabric'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          role?: UserRole
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          code: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          tax_code: string | null
          contact_person: string | null
          source: CustomerSource
          notes: string | null
          status: ActiveStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_code?: string | null
          contact_person?: string | null
          source?: CustomerSource
          notes?: string | null
          status?: ActiveStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_code?: string | null
          contact_person?: string | null
          source?: CustomerSource
          notes?: string | null
          status?: ActiveStatus
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          code: string
          name: string
          category: SupplierCategory
          phone: string | null
          email: string | null
          address: string | null
          tax_code: string | null
          contact_person: string | null
          notes: string | null
          status: ActiveStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          category?: SupplierCategory
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_code?: string | null
          contact_person?: string | null
          notes?: string | null
          status?: ActiveStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          category?: SupplierCategory
          phone?: string | null
          email?: string | null
          address?: string | null
          tax_code?: string | null
          contact_person?: string | null
          notes?: string | null
          status?: ActiveStatus
          updated_at?: string
        }
        Relationships: []
      }
      raw_fabric_rolls: {
        Row: {
          id: string
          roll_number: string
          yarn_receipt_id: string | null
          weaving_partner_id: string | null
          fabric_type: string
          color_name: string | null
          color_code: string | null
          width_cm: number | null
          length_m: number | null
          weight_kg: number | null
          quality_grade: string | null
          status: RollStatus
          warehouse_location: string | null
          production_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          roll_number: string
          yarn_receipt_id?: string | null
          weaving_partner_id?: string | null
          fabric_type: string
          color_name?: string | null
          color_code?: string | null
          width_cm?: number | null
          length_m?: number | null
          weight_kg?: number | null
          quality_grade?: string | null
          status: RollStatus
          warehouse_location?: string | null
          production_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          roll_number?: string
          yarn_receipt_id?: string | null
          weaving_partner_id?: string | null
          fabric_type?: string
          color_name?: string | null
          color_code?: string | null
          width_cm?: number | null
          length_m?: number | null
          weight_kg?: number | null
          quality_grade?: string | null
          status?: RollStatus
          warehouse_location?: string | null
          production_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finished_fabric_rolls: {
        Row: {
          id: string
          roll_number: string
          raw_roll_id: string | null
          fabric_type: string
          color_name: string | null
          color_code: string | null
          width_cm: number | null
          length_m: number | null
          weight_kg: number | null
          quality_grade: string | null
          status: RollStatus
          warehouse_location: string | null
          production_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          roll_number: string
          raw_roll_id?: string | null
          fabric_type: string
          color_name?: string | null
          color_code?: string | null
          width_cm?: number | null
          length_m?: number | null
          weight_kg?: number | null
          quality_grade?: string | null
          status: RollStatus
          warehouse_location?: string | null
          production_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          roll_number?: string
          raw_roll_id?: string | null
          fabric_type?: string
          color_name?: string | null
          color_code?: string | null
          width_cm?: number | null
          length_m?: number | null
          weight_kg?: number | null
          quality_grade?: string | null
          status?: RollStatus
          warehouse_location?: string | null
          production_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      yarn_receipts: {
        Row: {
          id: string
          receipt_number: string
          supplier_id: string
          receipt_date: string
          total_amount: number
          status: DocStatus
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          receipt_number: string
          supplier_id: string
          receipt_date?: string
          total_amount?: number
          status?: DocStatus
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          receipt_number?: string
          supplier_id?: string
          receipt_date?: string
          total_amount?: number
          status?: DocStatus
          notes?: string | null
          created_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      yarn_receipt_items: {
        Row: {
          id: string
          receipt_id: string
          yarn_type: string
          color_name: string | null
          color_code: string | null
          unit: string
          quantity: number
          unit_price: number
          amount: number
          lot_number: string | null
          tensile_strength: string | null
          composition: string | null
          origin: string | null
          notes: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          receipt_id: string
          yarn_type: string
          color_name?: string | null
          color_code?: string | null
          unit?: string
          quantity: number
          unit_price?: number
          lot_number?: string | null
          tensile_strength?: string | null
          composition?: string | null
          origin?: string | null
          notes?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          receipt_id?: string
          yarn_type?: string
          color_name?: string | null
          color_code?: string | null
          unit?: string
          quantity?: number
          unit_price?: number
          lot_number?: string | null
          tensile_strength?: string | null
          composition?: string | null
          origin?: string | null
          notes?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          order_date: string
          delivery_date: string | null
          total_amount: number
          paid_amount: number
          status: OrderStatus
          notes: string | null
          confirmed_by: string | null
          confirmed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_id: string
          order_date?: string
          delivery_date?: string | null
          total_amount?: number
          paid_amount?: number
          status?: OrderStatus
          notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          order_date?: string
          delivery_date?: string | null
          total_amount?: number
          paid_amount?: number
          status?: OrderStatus
          notes?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          fabric_type: string
          color_name: string | null
          color_code: string | null
          quantity: number
          unit: string
          unit_price: number
          amount: number
          notes: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          order_id: string
          fabric_type: string
          color_name?: string | null
          color_code?: string | null
          quantity: number
          unit?: string
          unit_price?: number
          notes?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          order_id?: string
          fabric_type?: string
          color_name?: string | null
          color_code?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          notes?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      order_progress: {
        Row: {
          id: string
          order_id: string
          stage: ProductionStage
          status: StageStatus
          planned_date: string | null
          actual_date: string | null
          notes: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          stage: ProductionStage
          status?: StageStatus
          planned_date?: string | null
          actual_date?: string | null
          notes?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          stage?: ProductionStage
          status?: StageStatus
          planned_date?: string | null
          actual_date?: string | null
          notes?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          id: string
          shipment_number: string
          order_id: string
          customer_id: string
          shipment_date: string
          delivery_address: string | null
          carrier: string | null
          tracking_number: string | null
          status: ShipmentStatus
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shipment_number: string
          order_id: string
          customer_id: string
          shipment_date?: string
          delivery_address?: string | null
          carrier?: string | null
          tracking_number?: string | null
          status?: ShipmentStatus
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shipment_number?: string
          order_id?: string
          customer_id?: string
          shipment_date?: string
          delivery_address?: string | null
          carrier?: string | null
          tracking_number?: string | null
          status?: ShipmentStatus
          notes?: string | null
          created_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipment_items: {
        Row: {
          id: string
          shipment_id: string
          finished_roll_id: string | null
          fabric_type: string
          color_name: string | null
          quantity: number
          unit: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          shipment_id: string
          finished_roll_id?: string | null
          fabric_type: string
          color_name?: string | null
          quantity: number
          unit?: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          shipment_id?: string
          finished_roll_id?: string | null
          fabric_type?: string
          color_name?: string | null
          quantity?: number
          unit?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          payment_number: string
          order_id: string
          customer_id: string
          payment_date: string
          amount: number
          payment_method: PaymentMethod
          reference_number: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_number: string
          order_id: string
          customer_id: string
          payment_date?: string
          amount: number
          payment_method?: PaymentMethod
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_number?: string
          order_id?: string
          customer_id?: string
          payment_date?: string
          amount?: number
          payment_method?: PaymentMethod
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          id: string
          adjustment_date: string
          item_type: InventoryItemType
          reference_id: string | null
          adjustment_type: AdjustmentType
          quantity_delta: number
          reason: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          adjustment_date?: string
          item_type: InventoryItemType
          reference_id?: string | null
          adjustment_type: AdjustmentType
          quantity_delta: number
          reason: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          adjustment_date?: string
          item_type?: InventoryItemType
          reference_id?: string | null
          adjustment_type?: AdjustmentType
          quantity_delta?: number
          reason?: string
          notes?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      update_supplier: {
        Args: {
          p_id: string
          p_code: string
          p_name: string
          p_category: SupplierCategory
          p_phone?: string | null
          p_email?: string | null
          p_address?: string | null
          p_tax_code?: string | null
          p_contact_person?: string | null
          p_notes?: string | null
          p_status?: ActiveStatus
        }
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      active_status: ActiveStatus
      doc_status: DocStatus
      order_status: OrderStatus
      production_stage: ProductionStage
      stage_status: StageStatus
      roll_status: RollStatus
      shipment_status: ShipmentStatus
      payment_method: PaymentMethod
      adjustment_type: AdjustmentType
      supplier_category: SupplierCategory
      customer_source: CustomerSource
      inventory_item_type: InventoryItemType
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
