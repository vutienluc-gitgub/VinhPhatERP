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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bom_templates: {
        Row: {
          active_version: number
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          standard_loss_pct: number | null
          status: Database["public"]["Enums"]["bom_status"]
          target_fabric_id: string
          target_gsm: number | null
          target_width_cm: number | null
          updated_at: string
        }
        Insert: {
          active_version?: number
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          standard_loss_pct?: number | null
          status?: Database["public"]["Enums"]["bom_status"]
          target_fabric_id: string
          target_gsm?: number | null
          target_width_cm?: number | null
          updated_at?: string
        }
        Update: {
          active_version?: number
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          standard_loss_pct?: number | null
          status?: Database["public"]["Enums"]["bom_status"]
          target_fabric_id?: string
          target_gsm?: number | null
          target_width_cm?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_templates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_templates_target_fabric_id_fkey"
            columns: ["target_fabric_id"]
            isOneToOne: false
            referencedRelation: "fabric_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_versions: {
        Row: {
          bom_template_id: string
          change_reason: string
          created_at: string
          created_by: string | null
          id: string
          snapshot: Json
          version: number
        }
        Insert: {
          bom_template_id: string
          change_reason: string
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot: Json
          version: number
        }
        Update: {
          bom_template_id?: string
          change_reason?: string
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bom_versions_bom_template_id_fkey"
            columns: ["bom_template_id"]
            isOneToOne: false
            referencedRelation: "bom_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_yarn_items: {
        Row: {
          bom_template_id: string
          consumption_kg_per_m: number
          created_at: string
          id: string
          notes: string | null
          ratio_pct: number
          sort_order: number
          version: number
          yarn_catalog_id: string
        }
        Insert: {
          bom_template_id: string
          consumption_kg_per_m: number
          created_at?: string
          id?: string
          notes?: string | null
          ratio_pct: number
          sort_order?: number
          version?: number
          yarn_catalog_id: string
        }
        Update: {
          bom_template_id?: string
          consumption_kg_per_m?: number
          created_at?: string
          id?: string
          notes?: string | null
          ratio_pct?: number
          sort_order?: number
          version?: number
          yarn_catalog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_yarn_items_bom_template_id_fkey"
            columns: ["bom_template_id"]
            isOneToOne: false
            referencedRelation: "bom_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_yarn_items_yarn_catalog_id_fkey"
            columns: ["yarn_catalog_id"]
            isOneToOne: false
            referencedRelation: "yarn_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_audit_log: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          credit_limit: number
          credit_status: Database["public"]["Enums"]["credit_status"]
          current_debt: number
          email: string | null
          id: string
          name: string
          notes: string | null
          overdue_debt: number
          payment_terms: string
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
          credit_limit?: number
          credit_status?: Database["public"]["Enums"]["credit_status"]
          current_debt?: number
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          overdue_debt?: number
          payment_terms?: string
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
          credit_limit?: number
          credit_status?: Database["public"]["Enums"]["credit_status"]
          current_debt?: number
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          overdue_debt?: number
          payment_terms?: string
          phone?: string | null
          source?: Database["public"]["Enums"]["customer_source"] | null
          status?: Database["public"]["Enums"]["active_status"]
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          expense_number: string
          id: string
          notes: string | null
          reference_number: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          expense_number: string
          id?: string
          notes?: string | null
          reference_number?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          expense_number?: string
          id?: string
          notes?: string | null
          reference_number?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_debt"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
      fabric_catalogs: {
        Row: {
          code: string
          composition: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["active_status"]
          unit: string
          updated_at: string
        }
        Insert: {
          code: string
          composition?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          unit?: string
          updated_at?: string
        }
        Update: {
          code?: string
          composition?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          unit?: string
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
          {
            foreignKeyName: "finished_fabric_rolls_reserved_for_order_id_fkey"
            columns: ["reserved_for_order_id"]
            isOneToOne: false
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "finished_fabric_rolls_reserved_for_order_id_fkey"
            columns: ["reserved_for_order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "finished_fabric_rolls_reserved_for_order_id_fkey"
            columns: ["reserved_for_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finished_fabric_rolls_reserved_for_order_id_fkey"
            columns: ["reserved_for_order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
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
          width_cm: number | null
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
          width_cm?: number | null
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
          width_cm?: number | null
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
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_lot_allocations: {
        Row: {
          allocated_meters: number
          created_at: string
          id: string
          order_id: string
          order_item_id: string | null
          release_reason: string | null
          released_at: string | null
          reserved_at: string
          roll_id: string
        }
        Insert: {
          allocated_meters: number
          created_at?: string
          id?: string
          order_id: string
          order_item_id?: string | null
          release_reason?: string | null
          released_at?: string | null
          reserved_at?: string
          roll_id: string
        }
        Update: {
          allocated_meters?: number
          created_at?: string
          id?: string
          order_id?: string
          order_item_id?: string | null
          release_reason?: string | null
          released_at?: string | null
          reserved_at?: string
          roll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_lot_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lot_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_lot_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_lot_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lot_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_lot_allocations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lot_allocations_roll_id_fkey"
            columns: ["roll_id"]
            isOneToOne: false
            referencedRelation: "finished_fabric_rolls"
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
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
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
          source_quotation_id: string | null
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
          source_quotation_id?: string | null
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
          source_quotation_id?: string | null
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
          {
            foreignKeyName: "orders_source_quotation_id_fkey"
            columns: ["source_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          name: string
          notes: string | null
          status: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name: string
          notes?: string | null
          status?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name?: string
          notes?: string | null
          status?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_id: string | null
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
          account_id?: string | null
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
          account_id?: string | null
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
            foreignKeyName: "payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
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
      progress_audit_log: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["stage_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["stage_status"] | null
          order_id: string
          progress_id: string
          stage: Database["public"]["Enums"]["production_stage"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["stage_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["stage_status"] | null
          order_id: string
          progress_id: string
          stage: Database["public"]["Enums"]["production_stage"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["stage_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["stage_status"] | null
          order_id?: string
          progress_id?: string
          stage?: Database["public"]["Enums"]["production_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "progress_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_audit_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_audit_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "progress_audit_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "progress_audit_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_audit_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "progress_audit_log_progress_id_fkey"
            columns: ["progress_id"]
            isOneToOne: false
            referencedRelation: "order_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          amount: number
          color_code: string | null
          color_name: string | null
          fabric_type: string
          id: string
          lead_time_days: number | null
          notes: string | null
          quantity: number
          quotation_id: string
          sort_order: number
          unit: string
          unit_price: number
          width_cm: number | null
        }
        Insert: {
          amount?: number
          color_code?: string | null
          color_name?: string | null
          fabric_type: string
          id?: string
          lead_time_days?: number | null
          notes?: string | null
          quantity: number
          quotation_id: string
          sort_order?: number
          unit?: string
          unit_price?: number
          width_cm?: number | null
        }
        Update: {
          amount?: number
          color_code?: string | null
          color_name?: string | null
          fabric_type?: string
          id?: string
          lead_time_days?: number | null
          notes?: string | null
          quantity?: number
          quotation_id?: string
          sort_order?: number
          unit?: string
          unit_price?: number
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          confirmed_at: string | null
          converted_order_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_terms: string | null
          discount_amount: number
          discount_type: string
          discount_value: number
          id: string
          notes: string | null
          parent_quotation_id: string | null
          payment_terms: string | null
          quotation_date: string
          quotation_number: string
          revision: number
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          total_amount: number
          total_before_vat: number
          updated_at: string
          valid_until: string | null
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          confirmed_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_terms?: string | null
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          notes?: string | null
          parent_quotation_id?: string | null
          payment_terms?: string | null
          quotation_date?: string
          quotation_number: string
          revision?: number
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          total_amount?: number
          total_before_vat?: number
          updated_at?: string
          valid_until?: string | null
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          confirmed_at?: string | null
          converted_order_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_terms?: string | null
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          notes?: string | null
          parent_quotation_id?: string | null
          payment_terms?: string | null
          quotation_date?: string
          quotation_number?: string
          revision?: number
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          total_amount?: number
          total_before_vat?: number
          updated_at?: string
          valid_until?: string | null
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "quotations_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "quotations_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_converted_order_id_fkey"
            columns: ["converted_order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "quotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_parent_quotation_id_fkey"
            columns: ["parent_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
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
          work_order_id: string | null
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
          work_order_id?: string | null
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
          work_order_id?: string | null
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
            foreignKeyName: "raw_fabric_rolls_weaving_partner_id_fkey"
            columns: ["weaving_partner_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_debt"
            referencedColumns: ["supplier_id"]
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
          delivered_at: string | null
          delivery_address: string | null
          delivery_proof: string | null
          delivery_staff_id: string | null
          id: string
          loading_fee: number
          notes: string | null
          order_id: string
          prepared_at: string | null
          receiver_name: string | null
          receiver_phone: string | null
          shipment_date: string
          shipment_number: string
          shipped_at: string | null
          shipping_cost: number
          shipping_rate_id: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          total_meters: number | null
          total_weight_kg: number | null
          tracking_number: string | null
          updated_at: string
          vehicle_info: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_proof?: string | null
          delivery_staff_id?: string | null
          id?: string
          loading_fee?: number
          notes?: string | null
          order_id: string
          prepared_at?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          shipment_date?: string
          shipment_number: string
          shipped_at?: string | null
          shipping_cost?: number
          shipping_rate_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          total_meters?: number | null
          total_weight_kg?: number | null
          tracking_number?: string | null
          updated_at?: string
          vehicle_info?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_proof?: string | null
          delivery_staff_id?: string | null
          id?: string
          loading_fee?: number
          notes?: string | null
          order_id?: string
          prepared_at?: string | null
          receiver_name?: string | null
          receiver_phone?: string | null
          shipment_date?: string
          shipment_number?: string
          shipped_at?: string | null
          shipping_cost?: number
          shipping_rate_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          total_meters?: number | null
          total_weight_kg?: number | null
          tracking_number?: string | null
          updated_at?: string
          vehicle_info?: string | null
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
            foreignKeyName: "shipments_delivery_staff_id_fkey"
            columns: ["delivery_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "shipments_shipping_rate_id_fkey"
            columns: ["shipping_rate_id"]
            isOneToOne: false
            referencedRelation: "shipping_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          created_at: string
          created_by: string | null
          destination_area: string
          id: string
          is_active: boolean
          loading_fee: number
          min_charge: number
          name: string
          notes: string | null
          rate_per_kg: number | null
          rate_per_meter: number | null
          rate_per_trip: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination_area: string
          id?: string
          is_active?: boolean
          loading_fee?: number
          min_charge?: number
          name: string
          notes?: string | null
          rate_per_kg?: number | null
          rate_per_meter?: number | null
          rate_per_trip?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination_area?: string
          id?: string
          is_active?: boolean
          loading_fee?: number
          min_charge?: number
          name?: string
          notes?: string | null
          rate_per_kg?: number | null
          rate_per_meter?: number | null
          rate_per_trip?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      work_order_y_requirements: {
        Row: {
          allocated_kg: number
          bom_ratio_pct: number
          created_at: string
          id: string
          notes: string | null
          required_kg: number
          updated_at: string
          work_order_id: string
          yarn_catalog_id: string
        }
        Insert: {
          allocated_kg?: number
          bom_ratio_pct: number
          created_at?: string
          id?: string
          notes?: string | null
          required_kg: number
          updated_at?: string
          work_order_id: string
          yarn_catalog_id: string
        }
        Update: {
          allocated_kg?: number
          bom_ratio_pct?: number
          created_at?: string
          id?: string
          notes?: string | null
          required_kg?: number
          updated_at?: string
          work_order_id?: string
          yarn_catalog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_y_requirements_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_y_requirements_yarn_catalog_id_fkey"
            columns: ["yarn_catalog_id"]
            isOneToOne: false
            referencedRelation: "yarn_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_loss_pct: number | null
          actual_yield_m: number | null
          bom_template_id: string
          bom_version: number
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          standard_loss_pct: number
          start_date: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          target_quantity_m: number
          target_weight_kg: number | null
          updated_at: string
          updated_by: string | null
          work_order_number: string
        }
        Insert: {
          actual_loss_pct?: number | null
          actual_yield_m?: number | null
          bom_template_id: string
          bom_version: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          standard_loss_pct?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          target_quantity_m: number
          target_weight_kg?: number | null
          updated_at?: string
          updated_by?: string | null
          work_order_number: string
        }
        Update: {
          actual_loss_pct?: number | null
          actual_yield_m?: number | null
          bom_template_id?: string
          bom_version?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          standard_loss_pct?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          target_quantity_m?: number
          target_weight_kg?: number | null
          updated_at?: string
          updated_by?: string | null
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_bom_template_id_fkey"
            columns: ["bom_template_id"]
            isOneToOne: false
            referencedRelation: "bom_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "work_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "work_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "work_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      yarn_catalogs: {
        Row: {
          code: string
          color_name: string | null
          composition: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          origin: string | null
          status: Database["public"]["Enums"]["active_status"]
          tensile_strength: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          code: string
          color_name?: string | null
          composition?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          origin?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          tensile_strength?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          code?: string
          color_name?: string | null
          composition?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          origin?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          tensile_strength?: string | null
          unit?: string
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
          yarn_catalog_id: string | null
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
          yarn_catalog_id?: string | null
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
          yarn_catalog_id?: string | null
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
          {
            foreignKeyName: "yarn_receipt_items_yarn_catalog_id_fkey"
            columns: ["yarn_catalog_id"]
            isOneToOne: false
            referencedRelation: "yarn_catalogs"
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
          {
            foreignKeyName: "yarn_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_debt"
            referencedColumns: ["supplier_id"]
          },
        ]
      }
    }
    Views: {
      v_debt_aging: {
        Row: {
          aging_bucket: string | null
          balance_due: number | null
          customer_id: string | null
          customer_name: string | null
          days_since_order: number | null
          delivery_date: string | null
          order_date: string | null
          order_id: string | null
          order_number: string | null
          paid_amount: number | null
          total_amount: number | null
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
      v_debt_by_customer: {
        Row: {
          balance_due: number | null
          customer_code: string | null
          customer_id: string | null
          customer_name: string | null
          paid_amount: number | null
          total_amount: number | null
          total_orders: number | null
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
      v_inventory_demand: {
        Row: {
          available_length_m: number | null
          available_rolls: number | null
          color_name: string | null
          demanded_qty: number | null
          fabric_type: string | null
          reserved_length_m: number | null
          reserved_rolls: number | null
          unit: string | null
        }
        Relationships: []
      }
      v_monthly_revenue: {
        Row: {
          month: string | null
          order_count: number | null
          total_collected: number | null
          total_outstanding: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_on_time_delivery: {
        Row: {
          customer_name: string | null
          delivery_date: string | null
          is_on_time: boolean | null
          order_id: string | null
          order_number: string | null
          status: Database["public"]["Enums"]["order_status"] | null
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
      v_overdue_orders: {
        Row: {
          balance_due: number | null
          customer_name: string | null
          days_overdue: number | null
          delivery_date: string | null
          order_date: string | null
          order_id: string | null
          order_number: string | null
          paid_amount: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total_amount: number | null
        }
        Relationships: []
      }
      v_payment_collection: {
        Row: {
          month: string | null
          payment_count: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          total_collected: number | null
        }
        Relationships: []
      }
      v_production_efficiency: {
        Row: {
          actual_date: string | null
          customer_name: string | null
          deviation_days: number | null
          is_late: boolean | null
          order_id: string | null
          order_number: string | null
          planned_date: string | null
          stage: Database["public"]["Enums"]["production_stage"] | null
          stage_status: Database["public"]["Enums"]["stage_status"] | null
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
            referencedRelation: "v_debt_aging"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_on_time_delivery"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_progress_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_orders"
            referencedColumns: ["order_id"]
          },
        ]
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
      v_revenue_by_fabric: {
        Row: {
          avg_unit_price: number | null
          color_name: string | null
          fabric_type: string | null
          order_count: number | null
          total_quantity: number | null
          total_revenue: number | null
          unit: string | null
        }
        Relationships: []
      }
      v_supplier_debt: {
        Row: {
          balance_due: number | null
          receipt_count: number | null
          supplier_code: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_paid: number | null
          total_purchased: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      fn_create_order_atomic: {
        Args: {
          p_allocations: Json
          p_created_by: string
          p_customer_id: string
          p_delivery_date: string
          p_items: Json
          p_manager_override: boolean
          p_notes: string
          p_order_date: string
          p_order_number: string
          p_override_user_id: string
          p_source_quotation_id: string
          p_total_amount: number
        }
        Returns: Json
      }
      get_cash_flow_summary: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          inflow_count: number
          net_flow: number
          outflow_count: number
          period: string
          total_inflow: number
          total_outflow: number
        }[]
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
      get_expense_by_category: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          category: Database["public"]["Enums"]["expense_category"]
          expense_count: number
          total_amount: number
        }[]
      }
      release_order_allocations: {
        Args: { p_order_id: string; p_reason: string }
        Returns: undefined
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
      account_type: "cash" | "bank"
      active_status: "active" | "inactive"
      adjustment_type: "increase" | "decrease" | "correction"
      bom_status: "draft" | "approved" | "deprecated"
      credit_status: "active" | "on_hold" | "blocked"
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
      expense_category:
        | "supplier_payment"
        | "yarn_purchase"
        | "weaving_cost"
        | "dyeing_cost"
        | "salary"
        | "rent"
        | "utilities"
        | "logistics"
        | "equipment"
        | "other"
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
      quotation_status:
        | "draft"
        | "sent"
        | "confirmed"
        | "rejected"
        | "expired"
        | "converted"
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
      user_role: "admin" | "manager" | "staff" | "driver" | "viewer" | "sale"
      work_order_status: "draft" | "in_progress" | "completed" | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["cash", "bank"],
      active_status: ["active", "inactive"],
      adjustment_type: ["increase", "decrease", "correction"],
      bom_status: ["draft", "approved", "deprecated"],
      credit_status: ["active", "on_hold", "blocked"],
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
      expense_category: [
        "supplier_payment",
        "yarn_purchase",
        "weaving_cost",
        "dyeing_cost",
        "salary",
        "rent",
        "utilities",
        "logistics",
        "equipment",
        "other",
      ],
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
      quotation_status: [
        "draft",
        "sent",
        "confirmed",
        "rejected",
        "expired",
        "converted",
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
      user_role: ["admin", "manager", "staff", "driver", "viewer", "sale"],
      work_order_status: ["draft", "in_progress", "completed", "cancelled"],
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
export type AccountType = Enums<'account_type'>
export type ExpenseCategory = Enums<'expense_category'>
export type QuotationStatusDb = Enums<'quotation_status'>
export type BomStatus = Enums<'bom_status'>
export type WorkOrderStatusDb = Enums<'work_order_status'>

export type Profile = Tables<'profiles'>
