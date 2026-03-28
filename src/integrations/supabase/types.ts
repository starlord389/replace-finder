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
      request_status: "submitted" | "under_review" | "active" | "closed"
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
      request_status: ["submitted", "under_review", "active", "closed"],
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
