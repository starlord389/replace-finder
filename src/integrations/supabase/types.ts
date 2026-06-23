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
      agent_clients: {
        Row: {
          agent_id: string
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_user_id: string | null
          created_at: string
          id: string
          notes: string | null
          referral_id: string | null
          referred_by_platform: boolean
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          referral_id?: string | null
          referred_by_platform?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          referral_id?: string | null
          referred_by_platform?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          mortgage_amortization_years: number
          mortgage_interest_rate: number
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mortgage_amortization_years: number
          mortgage_interest_rate: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mortgage_amortization_years?: number
          mortgage_interest_rate?: number
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      article_feedback: {
        Row: {
          article_id: string
          article_title: string
          article_type: string
          comment: string | null
          created_at: string
          helpful: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          article_title: string
          article_type: string
          comment?: string | null
          created_at?: string
          helpful: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          article_title?: string
          article_type?: string
          comment?: string | null
          created_at?: string
          helpful?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brokerage_waitlist_signups: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          agent_id: string
          client_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          agent_id: string
          client_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          agent_id?: string
          client_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          company: string
          created_at: string
          full_name: string
          id: string
          internal_notes: string | null
          meeting_link: string | null
          phone: string | null
          role: string
          scheduled_at: string | null
          status: string
          timeline: string | null
          use_case: string
          work_email: string
        }
        Insert: {
          company: string
          created_at?: string
          full_name: string
          id?: string
          internal_notes?: string | null
          meeting_link?: string | null
          phone?: string | null
          role: string
          scheduled_at?: string | null
          status?: string
          timeline?: string | null
          use_case: string
          work_email: string
        }
        Update: {
          company?: string
          created_at?: string
          full_name?: string
          id?: string
          internal_notes?: string | null
          meeting_link?: string | null
          phone?: string | null
          role?: string
          scheduled_at?: string | null
          status?: string
          timeline?: string | null
          use_case?: string
          work_email?: string
        }
        Relationships: []
      }
      exchange_connections: {
        Row: {
          accepted_at: string | null
          buyer_agent_id: string
          buyer_exchange_id: string
          closed_at: string | null
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          facilitation_fee_agreed: boolean
          facilitation_fee_amount: number | null
          facilitation_fee_status: string
          failed_at: string | null
          failure_reason: string | null
          financing_approved_at: string | null
          id: string
          initiated_at: string
          initiated_by: string
          inspection_complete_at: string | null
          match_id: string
          seller_agent_id: string
          seller_exchange_id: string | null
          status: string
          under_contract_at: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          buyer_agent_id: string
          buyer_exchange_id: string
          closed_at?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          facilitation_fee_agreed?: boolean
          facilitation_fee_amount?: number | null
          facilitation_fee_status?: string
          failed_at?: string | null
          failure_reason?: string | null
          financing_approved_at?: string | null
          id?: string
          initiated_at?: string
          initiated_by: string
          inspection_complete_at?: string | null
          match_id: string
          seller_agent_id: string
          seller_exchange_id?: string | null
          status?: string
          under_contract_at?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          buyer_agent_id?: string
          buyer_exchange_id?: string
          closed_at?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          facilitation_fee_agreed?: boolean
          facilitation_fee_amount?: number | null
          facilitation_fee_status?: string
          failed_at?: string | null
          failure_reason?: string | null
          financing_approved_at?: string | null
          id?: string
          initiated_at?: string
          initiated_by?: string
          inspection_complete_at?: string | null
          match_id?: string
          seller_agent_id?: string
          seller_exchange_id?: string | null
          status?: string
          under_contract_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_connections_buyer_exchange_id_fkey"
            columns: ["buyer_exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_connections_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_connections_seller_exchange_id_fkey"
            columns: ["seller_exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_timeline: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string
          event_type: string
          exchange_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description: string
          event_type: string
          exchange_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string
          event_type?: string
          exchange_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_timeline_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
        ]
      }
      exchanges: {
        Row: {
          actual_close_date: string | null
          agent_id: string
          client_id: string
          closing_deadline: string | null
          created_at: string
          criteria_id: string | null
          estimated_basis: number | null
          estimated_equity: number | null
          estimated_gain: number | null
          estimated_tax_liability: number | null
          exchange_proceeds: number | null
          id: string
          identification_deadline: string | null
          pipeline_stage_override: string | null
          relinquished_property_id: string | null
          sale_close_date: string | null
          status: Database["public"]["Enums"]["exchange_status"]
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          agent_id: string
          client_id: string
          closing_deadline?: string | null
          created_at?: string
          criteria_id?: string | null
          estimated_basis?: number | null
          estimated_equity?: number | null
          estimated_gain?: number | null
          estimated_tax_liability?: number | null
          exchange_proceeds?: number | null
          id?: string
          identification_deadline?: string | null
          pipeline_stage_override?: string | null
          relinquished_property_id?: string | null
          sale_close_date?: string | null
          status?: Database["public"]["Enums"]["exchange_status"]
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          agent_id?: string
          client_id?: string
          closing_deadline?: string | null
          created_at?: string
          criteria_id?: string | null
          estimated_basis?: number | null
          estimated_equity?: number | null
          estimated_gain?: number | null
          estimated_tax_liability?: number | null
          exchange_proceeds?: number | null
          id?: string
          identification_deadline?: string | null
          pipeline_stage_override?: string | null
          relinquished_property_id?: string | null
          sale_close_date?: string | null
          status?: Database["public"]["Enums"]["exchange_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchanges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "agent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_criteria_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "replacement_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_relinquished_property_fkey"
            columns: ["relinquished_property_id"]
            isOneToOne: false
            referencedRelation: "pledged_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      identification_list: {
        Row: {
          added_at: string
          exchange_id: string
          id: string
          match_id: string | null
          position: number
          property_id: string
          removed_at: string | null
          status: string
        }
        Insert: {
          added_at?: string
          exchange_id: string
          id?: string
          match_id?: string | null
          position: number
          property_id: string
          removed_at?: string | null
          status?: string
        }
        Update: {
          added_at?: string
          exchange_id?: string
          id?: string
          match_id?: string | null
          position?: number
          property_id?: string
          removed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "identification_list_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identification_list_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identification_list_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pledged_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          asset_score: number
          boot_status: Database["public"]["Enums"]["boot_status"]
          buyer_agent_viewed: boolean
          buyer_agent_viewed_at: string | null
          buyer_current_roe: number | null
          buyer_exchange_id: string
          candidate_annual_debt_service: number | null
          candidate_roe: number | null
          created_at: string
          debt_fit_score: number
          estimated_boot_tax: number | null
          estimated_cash_boot: number | null
          estimated_mortgage_boot: number | null
          estimated_total_boot: number | null
          financial_score: number
          geo_score: number
          id: string
          price_score: number
          roe_improvement_pp: number | null
          roe_improvement_rel: number | null
          scale_fit_score: number
          seller_agent_viewed: boolean
          seller_agent_viewed_at: string | null
          seller_property_id: string
          status: string
          strategy_score: number
          timing_score: number
          total_score: number
          updated_at: string
        }
        Insert: {
          asset_score?: number
          boot_status?: Database["public"]["Enums"]["boot_status"]
          buyer_agent_viewed?: boolean
          buyer_agent_viewed_at?: string | null
          buyer_current_roe?: number | null
          buyer_exchange_id: string
          candidate_annual_debt_service?: number | null
          candidate_roe?: number | null
          created_at?: string
          debt_fit_score?: number
          estimated_boot_tax?: number | null
          estimated_cash_boot?: number | null
          estimated_mortgage_boot?: number | null
          estimated_total_boot?: number | null
          financial_score?: number
          geo_score?: number
          id?: string
          price_score?: number
          roe_improvement_pp?: number | null
          roe_improvement_rel?: number | null
          scale_fit_score?: number
          seller_agent_viewed?: boolean
          seller_agent_viewed_at?: string | null
          seller_property_id: string
          status?: string
          strategy_score?: number
          timing_score?: number
          total_score?: number
          updated_at?: string
        }
        Update: {
          asset_score?: number
          boot_status?: Database["public"]["Enums"]["boot_status"]
          buyer_agent_viewed?: boolean
          buyer_agent_viewed_at?: string | null
          buyer_current_roe?: number | null
          buyer_exchange_id?: string
          candidate_annual_debt_service?: number | null
          candidate_roe?: number | null
          created_at?: string
          debt_fit_score?: number
          estimated_boot_tax?: number | null
          estimated_cash_boot?: number | null
          estimated_mortgage_boot?: number | null
          estimated_total_boot?: number | null
          financial_score?: number
          geo_score?: number
          id?: string
          price_score?: number
          roe_improvement_pp?: number | null
          roe_improvement_rel?: number | null
          scale_fit_score?: number
          seller_agent_viewed?: boolean
          seller_agent_viewed_at?: string | null
          seller_property_id?: string
          status?: string
          strategy_score?: number
          timing_score?: number
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_buyer_exchange_id_fkey"
            columns: ["buyer_exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_seller_property_id_fkey"
            columns: ["seller_property_id"]
            isOneToOne: false
            referencedRelation: "pledged_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          connection_id: string
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          connection_id: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          connection_id?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "exchange_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link_to: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_to?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_to?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pledged_properties: {
        Row: {
          address: string | null
          address_is_public: boolean
          agent_id: string
          amenities: string[] | null
          asset_subtype: string | null
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          building_square_footage: number | null
          city: string | null
          construction_type: string | null
          county: string | null
          created_at: string
          description: string | null
          exchange_id: string | null
          hvac_type: string | null
          id: string
          land_area_acres: number | null
          listed_at: string | null
          num_buildings: number | null
          num_stories: number | null
          owner_authorization_confirmed: boolean
          parking_spaces: number | null
          parking_type: string | null
          property_class: string | null
          property_condition: string | null
          property_name: string | null
          recent_renovations: string | null
          roof_type: string | null
          source: Database["public"]["Enums"]["property_source"]
          state: string | null
          status: Database["public"]["Enums"]["pledged_property_status"]
          strategy_type: Database["public"]["Enums"]["strategy_type"] | null
          unit_suite: string | null
          units: number | null
          updated_at: string
          withdrawn_at: string | null
          year_built: number | null
          zip: string | null
          zoning: string | null
        }
        Insert: {
          address?: string | null
          address_is_public?: boolean
          agent_id: string
          amenities?: string[] | null
          asset_subtype?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          building_square_footage?: number | null
          city?: string | null
          construction_type?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          exchange_id?: string | null
          hvac_type?: string | null
          id?: string
          land_area_acres?: number | null
          listed_at?: string | null
          num_buildings?: number | null
          num_stories?: number | null
          owner_authorization_confirmed?: boolean
          parking_spaces?: number | null
          parking_type?: string | null
          property_class?: string | null
          property_condition?: string | null
          property_name?: string | null
          recent_renovations?: string | null
          roof_type?: string | null
          source?: Database["public"]["Enums"]["property_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["pledged_property_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"] | null
          unit_suite?: string | null
          units?: number | null
          updated_at?: string
          withdrawn_at?: string | null
          year_built?: number | null
          zip?: string | null
          zoning?: string | null
        }
        Update: {
          address?: string | null
          address_is_public?: boolean
          agent_id?: string
          amenities?: string[] | null
          asset_subtype?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          building_square_footage?: number | null
          city?: string | null
          construction_type?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          exchange_id?: string | null
          hvac_type?: string | null
          id?: string
          land_area_acres?: number | null
          listed_at?: string | null
          num_buildings?: number | null
          num_stories?: number | null
          owner_authorization_confirmed?: boolean
          parking_spaces?: number | null
          parking_type?: string | null
          property_class?: string | null
          property_condition?: string | null
          property_name?: string | null
          recent_renovations?: string | null
          roof_type?: string | null
          source?: Database["public"]["Enums"]["property_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["pledged_property_status"]
          strategy_type?: Database["public"]["Enums"]["strategy_type"] | null
          unit_suite?: string | null
          units?: number | null
          updated_at?: string
          withdrawn_at?: string | null
          year_built?: number | null
          zip?: string | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pledged_properties_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          brokerage_address: string | null
          brokerage_name: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          launchpad_completed_at: string | null
          launchpad_version: string | null
          license_number: string | null
          license_state: string | null
          mls_number: string | null
          phone: string | null
          profile_photo_url: string | null
          specializations: string[] | null
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          brokerage_address?: string | null
          brokerage_name?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          launchpad_completed_at?: string | null
          launchpad_version?: string | null
          license_number?: string | null
          license_state?: string | null
          mls_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          brokerage_address?: string | null
          brokerage_name?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          launchpad_completed_at?: string | null
          launchpad_version?: string | null
          license_number?: string | null
          license_state?: string | null
          mls_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      property_documents: {
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
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pledged_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_financials: {
        Row: {
          annual_debt_service: number | null
          annual_expenses: number | null
          annual_revenue: number | null
          appraised_value: number | null
          asking_price: number | null
          average_rent_per_unit: number | null
          cap_rate: number | null
          capex_reserves: number | null
          cash_on_cash: number | null
          created_at: string
          effective_gross_income: number | null
          gross_scheduled_income: number | null
          has_prepayment_penalty: boolean | null
          id: string
          insurance: number | null
          loan_balance: number | null
          loan_maturity_date: string | null
          loan_rate: number | null
          loan_type: string | null
          maintenance_repairs: number | null
          management_fee: number | null
          noi: number | null
          occupancy_rate: number | null
          other_expenses: number | null
          other_income: number | null
          prepayment_penalty_details: string | null
          property_id: string
          real_estate_taxes: number | null
          updated_at: string
          utilities: number | null
          vacancy_rate: number | null
        }
        Insert: {
          annual_debt_service?: number | null
          annual_expenses?: number | null
          annual_revenue?: number | null
          appraised_value?: number | null
          asking_price?: number | null
          average_rent_per_unit?: number | null
          cap_rate?: number | null
          capex_reserves?: number | null
          cash_on_cash?: number | null
          created_at?: string
          effective_gross_income?: number | null
          gross_scheduled_income?: number | null
          has_prepayment_penalty?: boolean | null
          id?: string
          insurance?: number | null
          loan_balance?: number | null
          loan_maturity_date?: string | null
          loan_rate?: number | null
          loan_type?: string | null
          maintenance_repairs?: number | null
          management_fee?: number | null
          noi?: number | null
          occupancy_rate?: number | null
          other_expenses?: number | null
          other_income?: number | null
          prepayment_penalty_details?: string | null
          property_id: string
          real_estate_taxes?: number | null
          updated_at?: string
          utilities?: number | null
          vacancy_rate?: number | null
        }
        Update: {
          annual_debt_service?: number | null
          annual_expenses?: number | null
          annual_revenue?: number | null
          appraised_value?: number | null
          asking_price?: number | null
          average_rent_per_unit?: number | null
          cap_rate?: number | null
          capex_reserves?: number | null
          cash_on_cash?: number | null
          created_at?: string
          effective_gross_income?: number | null
          gross_scheduled_income?: number | null
          has_prepayment_penalty?: boolean | null
          id?: string
          insurance?: number | null
          loan_balance?: number | null
          loan_maturity_date?: string | null
          loan_rate?: number | null
          loan_type?: string | null
          maintenance_repairs?: number | null
          management_fee?: number | null
          noi?: number | null
          occupancy_rate?: number | null
          other_expenses?: number | null
          other_income?: number | null
          prepayment_penalty_details?: string | null
          property_id?: string
          real_estate_taxes?: number | null
          updated_at?: string
          utilities?: number | null
          vacancy_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_financials_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "pledged_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
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
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pledged_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          assigned_agent_id: string | null
          assigned_at: string | null
          converted_at: string | null
          created_at: string
          estimated_value: number | null
          id: string
          owner_email: string
          owner_name: string
          owner_phone: string | null
          property_location: string | null
          property_type: string | null
          status: string
        }
        Insert: {
          assigned_agent_id?: string | null
          assigned_at?: string | null
          converted_at?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          owner_email: string
          owner_name: string
          owner_phone?: string | null
          property_location?: string | null
          property_type?: string | null
          status?: string
        }
        Update: {
          assigned_agent_id?: string | null
          assigned_at?: string | null
          converted_at?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          owner_email?: string
          owner_name?: string
          owner_phone?: string | null
          property_location?: string | null
          property_type?: string | null
          status?: string
        }
        Relationships: []
      }
      replacement_criteria: {
        Row: {
          additional_notes: string | null
          created_at: string
          exchange_id: string
          id: string
          min_debt_replacement: number | null
          must_replace_debt: boolean | null
          open_to_dsts: boolean | null
          open_to_tics: boolean | null
          target_asset_types: Database["public"]["Enums"]["asset_type"][]
          target_cap_rate_max: number | null
          target_cap_rate_min: number | null
          target_metros: string[] | null
          target_occupancy_min: number | null
          target_price_max: number
          target_price_min: number
          target_property_classes: string[] | null
          target_sf_max: number | null
          target_sf_min: number | null
          target_states: string[]
          target_strategies:
            | Database["public"]["Enums"]["strategy_type"][]
            | null
          target_units_max: number | null
          target_units_min: number | null
          target_year_built_min: number | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string
          exchange_id: string
          id?: string
          min_debt_replacement?: number | null
          must_replace_debt?: boolean | null
          open_to_dsts?: boolean | null
          open_to_tics?: boolean | null
          target_asset_types: Database["public"]["Enums"]["asset_type"][]
          target_cap_rate_max?: number | null
          target_cap_rate_min?: number | null
          target_metros?: string[] | null
          target_occupancy_min?: number | null
          target_price_max: number
          target_price_min: number
          target_property_classes?: string[] | null
          target_sf_max?: number | null
          target_sf_min?: number | null
          target_states: string[]
          target_strategies?:
            | Database["public"]["Enums"]["strategy_type"][]
            | null
          target_units_max?: number | null
          target_units_min?: number | null
          target_year_built_min?: number | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string
          exchange_id?: string
          id?: string
          min_debt_replacement?: number | null
          must_replace_debt?: boolean | null
          open_to_dsts?: boolean | null
          open_to_tics?: boolean | null
          target_asset_types?: Database["public"]["Enums"]["asset_type"][]
          target_cap_rate_max?: number | null
          target_cap_rate_min?: number | null
          target_metros?: string[] | null
          target_occupancy_min?: number | null
          target_price_max?: number
          target_price_min?: number
          target_property_classes?: string[] | null
          target_sf_max?: number | null
          target_sf_min?: number | null
          target_states?: string[]
          target_strategies?:
            | Database["public"]["Enums"]["strategy_type"][]
            | null
          target_units_max?: number | null
          target_units_min?: number | null
          target_year_built_min?: number | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replacement_criteria_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
        ]
      }
      request_images: {
        Row: {
          created_at: string | null
          file_name: string | null
          id: string
          request_id: string
          sort_order: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          request_id: string
          sort_order?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          id?: string
          request_id?: string
          sort_order?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          id: string
          message: string
          resolved_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_waitlist_signups: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          id: string
          notify_connection_accepted: boolean
          notify_connection_request: boolean
          notify_deadline_reminder: boolean
          notify_new_match: boolean
          notify_new_message: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_connection_accepted?: boolean
          notify_connection_request?: boolean
          notify_deadline_reminder?: boolean
          notify_new_match?: boolean
          notify_new_message?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_connection_accepted?: boolean
          notify_connection_request?: boolean
          notify_deadline_reminder?: boolean
          notify_new_match?: boolean
          notify_new_message?: boolean
          updated_at?: string
          user_id?: string
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
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          accepted_user_id: string
          agent_brokerage_name: string
          agent_full_name: string
          agent_id: string
          client_id: string
          email: string
          expires_at: string
          id: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_exchange_agent: {
        Args: { _exchange_id: string; _user_id: string }
        Returns: boolean
      }
      users_share_active_connection: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "broker" | "admin" | "agent"
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
      boot_status:
        | "no_boot"
        | "minor_boot"
        | "significant_boot"
        | "insufficient_data"
      exchange_status:
        | "draft"
        | "active"
        | "in_identification"
        | "in_closing"
        | "completed"
        | "failed"
        | "cancelled"
      pledged_property_status:
        | "draft"
        | "active"
        | "under_contract"
        | "exchanged"
        | "withdrawn"
      property_source: "agent_pledge" | "platform_sourced" | "dst"
      strategy_type:
        | "core"
        | "core_plus"
        | "value_add"
        | "opportunistic"
        | "development"
        | "nnn"
        | "other"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["client", "broker", "admin", "agent"],
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
      boot_status: [
        "no_boot",
        "minor_boot",
        "significant_boot",
        "insufficient_data",
      ],
      exchange_status: [
        "draft",
        "active",
        "in_identification",
        "in_closing",
        "completed",
        "failed",
        "cancelled",
      ],
      pledged_property_status: [
        "draft",
        "active",
        "under_contract",
        "exchanged",
        "withdrawn",
      ],
      property_source: ["agent_pledge", "platform_sourced", "dst"],
      strategy_type: [
        "core",
        "core_plus",
        "value_add",
        "opportunistic",
        "development",
        "nnn",
        "other",
      ],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
