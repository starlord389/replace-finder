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
      admin_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_request_preferences: {
        Row: {
          additional_notes: string | null
          created_at: string
          id: string
          request_id: string
          target_asset_types: Database["public"]["Enums"]["asset_type"][] | null
          target_cap_rate_max: number | null
          target_cap_rate_min: number | null
          target_metros: string[] | null
          target_price_max: number | null
          target_price_min: number | null
          target_states: string[] | null
          target_strategies:
            | Database["public"]["Enums"]["strategy_type"][]
            | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string
          id?: string
          request_id: string
          target_asset_types?:
            | Database["public"]["Enums"]["asset_type"][]
            | null
          target_cap_rate_max?: number | null
          target_cap_rate_min?: number | null
          target_metros?: string[] | null
          target_price_max?: number | null
          target_price_min?: number | null
          target_states?: string[] | null
          target_strategies?:
            | Database["public"]["Enums"]["strategy_type"][]
            | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          created_at?: string
          id?: string
          request_id?: string
          target_asset_types?:
            | Database["public"]["Enums"]["asset_type"][]
            | null
          target_cap_rate_max?: number | null
          target_cap_rate_min?: number | null
          target_metros?: string[] | null
          target_price_max?: number | null
          target_price_min?: number | null
          target_states?: string[] | null
          target_strategies?:
            | Database["public"]["Enums"]["strategy_type"][]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_request_preferences_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_request_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["request_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["request_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["request_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status"] | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_requests: {
        Row: {
          close_deadline: string | null
          created_at: string
          estimated_basis: number | null
          estimated_debt: number | null
          estimated_equity: number | null
          exchange_proceeds: number | null
          id: string
          identification_deadline: string | null
          relinquished_address: string | null
          relinquished_asset_type:
            | Database["public"]["Enums"]["asset_type"]
            | null
          relinquished_city: string | null
          relinquished_description: string | null
          relinquished_estimated_value: number | null
          relinquished_state: string | null
          relinquished_zip: string | null
          sale_timeline: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          close_deadline?: string | null
          created_at?: string
          estimated_basis?: number | null
          estimated_debt?: number | null
          estimated_equity?: number | null
          exchange_proceeds?: number | null
          id?: string
          identification_deadline?: string | null
          relinquished_address?: string | null
          relinquished_asset_type?:
            | Database["public"]["Enums"]["asset_type"]
            | null
          relinquished_city?: string | null
          relinquished_description?: string | null
          relinquished_estimated_value?: number | null
          relinquished_state?: string | null
          relinquished_zip?: string | null
          sale_timeline?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          close_deadline?: string | null
          created_at?: string
          estimated_basis?: number | null
          estimated_debt?: number | null
          estimated_equity?: number | null
          exchange_proceeds?: number | null
          id?: string
          identification_deadline?: string | null
          relinquished_address?: string | null
          relinquished_asset_type?:
            | Database["public"]["Enums"]["asset_type"]
            | null
          relinquished_city?: string | null
          relinquished_description?: string | null
          relinquished_estimated_value?: number | null
          relinquished_state?: string | null
          relinquished_zip?: string | null
          sale_timeline?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_name: string | null
          id: string
          property_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          id?: string
          property_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          id?: string
          property_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "inventory_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_financials: {
        Row: {
          annual_expenses: number | null
          annual_revenue: number | null
          asking_price: number | null
          cap_rate: number | null
          cash_on_cash: number | null
          created_at: string
          debt_amount: number | null
          debt_rate: number | null
          id: string
          noi: number | null
          notes: string | null
          occupancy_rate: number | null
          property_id: string
          updated_at: string
        }
        Insert: {
          annual_expenses?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          cap_rate?: number | null
          cash_on_cash?: number | null
          created_at?: string
          debt_amount?: number | null
          debt_rate?: number | null
          id?: string
          noi?: number | null
          notes?: string | null
          occupancy_rate?: number | null
          property_id: string
          updated_at?: string
        }
        Update: {
          annual_expenses?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          cap_rate?: number | null
          cash_on_cash?: number | null
          created_at?: string
          debt_amount?: number | null
          debt_rate?: number | null
          id?: string
          noi?: number | null
          notes?: string | null
          occupancy_rate?: number | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_financials_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "inventory_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_images: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          property_id: string
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          property_id: string
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          property_id?: string
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "inventory_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_properties: {
        Row: {
          address: string | null
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          name: string | null
          square_footage: number | null
          state: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          strategy_type: Database["public"]["Enums"]["strategy_type"] | null
          units: number | null
          updated_at: string
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          square_footage?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"] | null
          units?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          square_footage?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"] | null
          units?: number | null
          updated_at?: string
          year_built?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      inventory_source_metadata: {
        Row: {
          created_at: string
          date_sourced: string | null
          id: string
          notes: string | null
          property_id: string
          source_contact: string | null
          source_email: string | null
          source_phone: string | null
          source_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_sourced?: string | null
          id?: string
          notes?: string | null
          property_id: string
          source_contact?: string | null
          source_email?: string | null
          source_phone?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_sourced?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          source_contact?: string | null
          source_email?: string | null
          source_phone?: string | null
          source_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_source_metadata_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "inventory_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          asset_score: number
          client_response: string | null
          client_response_at: string | null
          client_response_note: string | null
          client_viewed_at: string | null
          created_at: string
          financial_score: number
          geo_score: number
          id: string
          match_run_id: string
          price_score: number
          property_id: string
          request_id: string
          status: Database["public"]["Enums"]["match_result_status"]
          strategy_score: number
          timing_score: number
          total_score: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asset_score?: number
          client_response?: string | null
          client_response_at?: string | null
          client_response_note?: string | null
          client_viewed_at?: string | null
          created_at?: string
          financial_score?: number
          geo_score?: number
          id?: string
          match_run_id: string
          price_score?: number
          property_id: string
          request_id: string
          status?: Database["public"]["Enums"]["match_result_status"]
          strategy_score?: number
          timing_score?: number
          total_score?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asset_score?: number
          client_response?: string | null
          client_response_at?: string | null
          client_response_note?: string | null
          client_viewed_at?: string | null
          created_at?: string
          financial_score?: number
          geo_score?: number
          id?: string
          match_run_id?: string
          price_score?: number
          property_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["match_result_status"]
          strategy_score?: number
          timing_score?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_run_id_fkey"
            columns: ["match_run_id"]
            isOneToOne: false
            referencedRelation: "match_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "inventory_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      match_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          request_id: string
          status: Database["public"]["Enums"]["match_run_status"]
          total_properties_scored: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          request_id: string
          status?: Database["public"]["Enums"]["match_run_status"]
          total_properties_scored?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["match_run_status"]
          total_properties_scored?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_runs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      matched_property_access: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          match_result_id: string
          property_id: string
          request_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          match_result_id: string
          property_id: string
          request_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          match_result_id?: string
          property_id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matched_property_access_match_result_id_fkey"
            columns: ["match_result_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matched_property_access_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "inventory_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matched_property_access_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "exchange_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "broker" | "admin"
      asset_type:
        | "multifamily"
        | "office"
        | "retail"
        | "industrial"
        | "medical_office"
        | "self_storage"
        | "hospitality"
        | "mixed_use"
        | "land"
        | "net_lease"
        | "other"
      inventory_status:
        | "draft"
        | "active"
        | "under_contract"
        | "closed"
        | "archived"
      match_result_status: "pending" | "approved" | "rejected"
      match_run_status: "pending" | "completed" | "failed"
      request_status:
        | "submitted"
        | "under_review"
        | "active"
        | "closed"
        | "draft"
      strategy_type:
        | "core"
        | "core_plus"
        | "value_add"
        | "opportunistic"
        | "development"
        | "nnn"
        | "other"
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
      app_role: ["client", "broker", "admin"],
      asset_type: [
        "multifamily",
        "office",
        "retail",
        "industrial",
        "medical_office",
        "self_storage",
        "hospitality",
        "mixed_use",
        "land",
        "net_lease",
        "other",
      ],
      inventory_status: [
        "draft",
        "active",
        "under_contract",
        "closed",
        "archived",
      ],
      match_result_status: ["pending", "approved", "rejected"],
      match_run_status: ["pending", "completed", "failed"],
      request_status: [
        "submitted",
        "under_review",
        "active",
        "closed",
        "draft",
      ],
      strategy_type: [
        "core",
        "core_plus",
        "value_add",
        "opportunistic",
        "development",
        "nnn",
        "other",
      ],
    },
  },
} as const
