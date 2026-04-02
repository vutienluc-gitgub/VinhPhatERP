export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["customer_source"] | null
          status: Database["public"]["Enums"]["active_status"]
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["customer_source"] | null
          status?: Database["public"]["Enums"]["active_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["customer_source"] | null
          status?: Database["public"]["Enums"]["active_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finished_fabric_rolls: {
        Row: {
          color_code: string | null
          color_name: string | null
          created_at: string
          fabric_type: string
          id: string
          length_m: number | null
          lot_number: string | null
          notes: string | null
          production_date: string | null
          quality_grade: string | null
          raw_roll_id: string
          reserved_for_order_id: string | null
          roll_number: string
          status: Database["public"]["Enums"]["roll_status"]
          updated_at: string
          warehouse_location: string | null
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          color_code?: string | null
          color_name?: string | null
          created_at?: string
          fabric_type: string
          id?: string
          length_m?: number | null
          lot_number?: string | null
          notes?: string | null
          production_date?: string | null
          quality_grade?: string | null
          raw_roll_id: string
          reserved_for_order_id?: string | null
          roll_number: string
          status?: Database["public"]["Enums"]["roll_status"]
          updated_at?: string
          warehouse_location?: string | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          color_code?: string | null
          color_name?: string | null
          created_at?: string
          fabric_type?: string
          id?: string
          length_m?: number | null
          lot_number?: string | null
          notes?: string | null
          production_date?: string | null
          quality_grade?: string | null
          raw_roll_id?: string
          reserved_for_order_id?: string | null
          roll_number?: string
          status?: Database["public"]["Enums"]["roll_status"]
          updated_at?: string
          warehouse_location?: string | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finished_fabric_rolls_raw_roll_id_fkey"
            columns: ["raw_roll_id"]
            isOneToOne: false
            referencedRelation: "raw_fabric_rolls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finished_fabric_rolls_reserved_for_order_id_fkey"
            columns: ["reserved_for_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          adjustment_date: string
          adjustment_type: Database["public"]["Enums"]["adjustment_type"]
          created_at: string
          created_by: string | null
          id: string
          item_type: Database["public"]["Enums"]["inventory_item_type"]
          notes: string | null
          quantity_delta: number
          reason: string
          reference_id: string | null
        }
        Insert: {
          adjustment_date?: string
          adjustment_type: Database["public"]["Enums"]["adjustment_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["inventory_item_type"]
          notes?: string | null
          quantity_delta: number
          reason: string
          reference_id?: string | null
        }
        Update: {
          adjustment_date?: string
          adjustment_type?: Database["public"]["Enums"]["adjustment_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["inventory_item_type"]
          notes?: string | null
          quantity_delta?: number
          reason?: string
          reference_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          amount: number | null
          color_code: string | null
          color_name: string | null
          fabric_type: string
          id: string
          notes: string | null
          order_id: string
          quantity: number
          sort_order: number
          unit: string
          unit_price: number
        }
        Insert: {
          amount?: number | null
          color_code?: string | null
          color_name?: string | null
          fabric_type: string
          id?: string
          notes?: string | null
          order_id: string
          quantity: number
          sort_order?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          amount?: number | null
          color_code?: string | null
          color_name?: string | null
          fabric_type?: string
          id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          sort_order?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      order_progress: {
        Row: {
          actual_date: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          planned_date: string | null
          stage: Database["public"]["Enums"]["production_stage"]
          status: Database["public"]["Enums"]["stage_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          planned_date?: string | null
          stage: Database["public"]["Enums"]["production_stage"]
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          planned_date?: string | null
          stage?: Database["public"]["Enums"]["production_stage"]
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          paid_amount: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          paid_amount?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          paid_amount?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          order_id: string
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          order_id: string
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_number: string
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_number?: string
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      raw_fabric_rolls: {
        Row: {
          barcode: string | null
          color_code: string | null
          color_name: string | null
          created_at: string
          fabric_type: string
          id: string
          length_m: number | null
          lot_number: string | null
          notes: string | null
          production_date: string | null
          quality_grade: string | null
          roll_number: string
          status: Database["public"]["Enums"]["roll_status"]
          updated_at: string
          warehouse_location: string | null
          weaving_partner_id: string | null
          weight_kg: number | null
          width_cm: number | null
          yarn_receipt_id: string | null
        }
        Insert: {
          barcode?: string | null
          color_code?: string | null
          color_name?: string | null
          created_at?: string
          fabric_type: string
          id?: string
          length_m?: number | null
          lot_number?: string | null
          notes?: string | null
          production_date?: string | null
          quality_grade?: string | null
          roll_number: string
          status?: Database["public"]["Enums"]["roll_status"]
          updated_at?: string
          warehouse_location?: string | null
          weaving_partner_id?: string | null
          weight_kg?: number | null
          width_cm?: number | null
          yarn_receipt_id?: string | null
        }
        Update: {
          barcode?: string | null
          color_code?: string | null
          color_name?: string | null
          created_at?: string
          fabric_type?: string
          id?: string
          length_m?: number | null
          lot_number?: string | null
          notes?: string | null
          production_date?: string | null
          quality_grade?: string | null
          roll_number?: string
          status?: Database["public"]["Enums"]["roll_status"]
          updated_at?: string
          warehouse_location?: string | null
          weaving_partner_id?: string | null
          weight_kg?: number | null
          width_cm?: number | null
          yarn_receipt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_fabric_rolls_weaving_partner_id_fkey"
            columns: ["weaving_partner_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_fabric_rolls_yarn_receipt_id_fkey"
            columns: ["yarn_receipt_id"]
            isOneToOne: false
            referencedRelation: "yarn_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      shipment_items: {
        Row: {
          color_name: string | null
          fabric_type: string
          finished_roll_id: string | null
          id: string
          notes: string | null
          quantity: number
          shipment_id: string
          sort_order: number
          unit: string
        }
        Insert: {
          color_name?: string | null
          fabric_type: string
          finished_roll_id?: string | null
          id?: string
          notes?: string | null
          quantity: number
          shipment_id: string
          sort_order?: number
          unit?: string
        }
        Update: {
          color_name?: string | null
          fabric_type?: string
          finished_roll_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          shipment_id?: string
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_items_finished_roll_id_fkey"
            columns: ["finished_roll_id"]
            isOneToOne: false
            referencedRelation: "finished_fabric_rolls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_address: string | null
          id: string
          notes: string | null
          order_id: string
          shipment_date: string
          shipment_number: string
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipment_date?: string
          shipment_number: string
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipment_date?: string
          shipment_number?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["supplier_category"]
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["active_status"]
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: Database["public"]["Enums"]["supplier_category"]
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["supplier_category"]
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      yarn_receipt_items: {
        Row: {
          amount: number | null
          color_code: string | null
          color_name: string | null
          composition: string | null
          id: string
          lot_number: string | null
          notes: string | null
          origin: string | null
          quantity: number
          receipt_id: string
          sort_order: number
          tensile_strength: string | null
          unit: string
          unit_price: number
          yarn_type: string
        }
        Insert: {
          amount?: number | null
          color_code?: string | null
          color_name?: string | null
          composition?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          origin?: string | null
          quantity: number
          receipt_id: string
          sort_order?: number
          tensile_strength?: string | null
          unit?: string
          unit_price?: number
          yarn_type: string
        }
        Update: {
          amount?: number | null
          color_code?: string | null
          color_name?: string | null
          composition?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          origin?: string | null
          quantity?: number
          receipt_id?: string
          sort_order?: number
          tensile_strength?: string | null
          unit?: string
          unit_price?: number
          yarn_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "yarn_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "yarn_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      yarn_receipts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          receipt_date: string
          receipt_number: string
          status: Database["public"]["Enums"]["doc_status"]
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          receipt_date?: string
          receipt_number: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          receipt_date?: string
          receipt_number?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "yarn_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_finished_fabric_inventory: {
        Row: {
          color_code: string | null
          color_name: string | null
          fabric_type: string | null
          quality_grade: string | null
          roll_count: number | null
          total_length_m: number | null
          total_weight_kg: number | null
        }
        Relationships: []
      }
      v_order_summary: {
        Row: {
          balance_due: number | null
          customer_name: string | null
          delivery_date: string | null
          id: string | null
          order_date: string | null
          order_number: string | null
          paid_amount: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
        }
        Relationships: []
      }
      v_raw_fabric_inventory: {
        Row: {
          color_code: string | null
          color_name: string | null
          fabric_type: string | null
          quality_grade: string | null
          roll_count: number | null
          total_length_m: number | null
          total_weight_kg: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_debt_summary: {
        Args: never
        Returns: {
          balance_due: number
          customer_code: string
          customer_id: string
          customer_name: string
          order_count: number
          total_ordered: number
          total_paid: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_supplier: {
        Args: {
          p_address?: string
          p_category: Database["public"]["Enums"]["supplier_category"]
          p_code: string
          p_contact_person?: string
          p_email?: string
          p_id: string
          p_name: string
          p_notes?: string
          p_phone?: string
          p_status?: Database["public"]["Enums"]["active_status"]
          p_tax_code?: string
        }
        Returns: string
      }
    }
    Enums: {
      active_status: "active" | "inactive"
      adjustment_type: "increase" | "decrease" | "correction"
      customer_source:
        | "referral"
        | "exhibition"
        | "zalo"
        | "facebook"
        | "online"
        | "direct"
        | "cold_call"
        | "other"
      doc_status: "draft" | "confirmed" | "cancelled"
      inventory_item_type: "yarn" | "raw_fabric" | "finished_fabric"
      order_status:
        | "draft"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_method: "cash" | "bank_transfer" | "check" | "other"
      production_stage:
        | "warping"
        | "weaving"
        | "greige_check"
        | "dyeing"
        | "finishing"
        | "final_check"
        | "packing"
      roll_status:
        | "in_stock"
        | "reserved"
        | "in_process"
        | "shipped"
        | "damaged"
        | "written_off"
      shipment_status:
        | "preparing"
        | "shipped"
        | "delivered"
        | "partially_returned"
        | "returned"
      stage_status: "pending" | "in_progress" | "done" | "skipped"
      supplier_category: "yarn" | "dye" | "accessories" | "other" | "weaving"
      user_role: "admin" | "manager" | "staff" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      active_status: ["active", "inactive"],
      adjustment_type: ["increase", "decrease", "correction"],
      customer_source: [
        "referral",
        "exhibition",
        "zalo",
        "facebook",
        "online",
        "direct",
        "cold_call",
        "other",
      ],
      doc_status: ["draft", "confirmed", "cancelled"],
      inventory_item_type: ["yarn", "raw_fabric", "finished_fabric"],
      order_status: [
        "draft",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_method: ["cash", "bank_transfer", "check", "other"],
      production_stage: [
        "warping",
        "weaving",
        "greige_check",
        "dyeing",
        "finishing",
        "final_check",
        "packing",
      ],
      roll_status: [
        "in_stock",
        "reserved",
        "in_process",
        "shipped",
        "damaged",
        "written_off",
      ],
      shipment_status: [
        "preparing",
        "shipped",
        "delivered",
        "partially_returned",
        "returned",
      ],
      stage_status: ["pending", "in_progress", "done", "skipped"],
      supplier_category: ["yarn", "dye", "accessories", "other", "weaving"],
      user_role: ["admin", "manager", "staff", "viewer"],
    },
  },
} as const

export type UserRole = Enums<'user_role'>
export type ActiveStatus = Enums<'active_status'>
export type DocStatus = Enums<'doc_status'>
export type OrderStatus = Enums<'order_status'>
export type ProductionStage = Enums<'production_stage'>
export type StageStatus = Enums<'stage_status'>
export type RollStatus = Enums<'roll_status'>
export type ShipmentStatus = Enums<'shipment_status'>
export type PaymentMethod = Enums<'payment_method'>
export type AdjustmentType = Enums<'adjustment_type'>
export type SupplierCategory = Enums<'supplier_category'>
export type CustomerSource = Enums<'customer_source'>
export type InventoryItemType = Enums<'inventory_item_type'>

export type Profile = Tables<'profiles'>
