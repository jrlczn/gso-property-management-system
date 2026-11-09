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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accountable_officers: {
        Row: {
          contact_no: string | null
          email: string | null
          employee_no: string | null
          first_name: string
          last_name: string
          office_id: number | null
          officer_id: number
          photo_url: string | null
          position: string | null
          status: string
        }
        Insert: {
          contact_no?: string | null
          email?: string | null
          employee_no?: string | null
          first_name: string
          last_name: string
          office_id?: number | null
          officer_id?: never
          photo_url?: string | null
          position?: string | null
          status?: string
        }
        Update: {
          contact_no?: string | null
          email?: string | null
          employee_no?: string | null
          first_name?: string
          last_name?: string
          office_id?: number | null
          officer_id?: never
          photo_url?: string | null
          position?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountable_officers_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["office_id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_date: string
          alert_id: number
          alert_message: string
          alert_type: string
          asset_id: number
          status: string
        }
        Insert: {
          alert_date?: string
          alert_id?: never
          alert_message: string
          alert_type: string
          asset_id: number
          status?: string
        }
        Update: {
          alert_date?: string
          alert_id?: never
          alert_message?: string
          alert_type?: string
          asset_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      asset_assignments: {
        Row: {
          asset_id: number
          assigned_date: string
          assignment_id: number
          office_id: number | null
          officer_id: number | null
          remarks: string | null
          returned_date: string | null
          status: string
        }
        Insert: {
          asset_id: number
          assigned_date?: string
          assignment_id?: never
          office_id?: number | null
          officer_id?: number | null
          remarks?: string | null
          returned_date?: string | null
          status?: string
        }
        Update: {
          asset_id?: number
          assigned_date?: string
          assignment_id?: never
          office_id?: number | null
          officer_id?: number | null
          remarks?: string | null
          returned_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "asset_assignments_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["office_id"]
          },
          {
            foreignKeyName: "asset_assignments_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "accountable_officers"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisition_cost: number
          acquisition_date: string
          asset_code: string
          asset_id: number
          asset_name: string
          assigned_office_id: number | null
          brand: string | null
          category_id: number | null
          created_at: string
          description: string | null
          expiration_date: string | null
          expiry_alert_days_before: number
          maintenance_alert_days_before: number
          model: string | null
          next_service_date: string | null
          qr_code: string | null
          remarks: string | null
          serial_number: string | null
          status: string
          useful_life_years: number
          warranty_alert_days_before: number
          warranty_expiry: string | null
        }
        Insert: {
          acquisition_cost?: number
          acquisition_date: string
          asset_code: string
          asset_id?: never
          asset_name: string
          assigned_office_id?: number | null
          brand?: string | null
          category_id?: number | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          expiry_alert_days_before?: number
          maintenance_alert_days_before?: number
          model?: string | null
          next_service_date?: string | null
          qr_code?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: string
          useful_life_years?: number
          warranty_alert_days_before?: number
          warranty_expiry?: string | null
        }
        Update: {
          acquisition_cost?: number
          acquisition_date?: string
          asset_code?: string
          asset_id?: never
          asset_name?: string
          assigned_office_id?: number | null
          brand?: string | null
          category_id?: number | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          expiry_alert_days_before?: number
          maintenance_alert_days_before?: number
          model?: string | null
          next_service_date?: string | null
          qr_code?: string | null
          remarks?: string | null
          serial_number?: string | null
          status?: string
          useful_life_years?: number
          warranty_alert_days_before?: number
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_office_id_fkey"
            columns: ["assigned_office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["office_id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      categories: {
        Row: {
          category_id: number
          category_name: string
          description: string | null
        }
        Insert: {
          category_id?: never
          category_name: string
          description?: string | null
        }
        Update: {
          category_id?: never
          category_name?: string
          description?: string | null
        }
        Relationships: []
      }
      disposal: {
        Row: {
          appraisal_value: number | null
          approved_by: string | null
          asset_id: number
          disposal_date: string
          disposal_id: number
          disposal_method: string
          inspection_date: string | null
          previous_status: string | null
          remarks: string | null
          status: string
        }
        Insert: {
          appraisal_value?: number | null
          approved_by?: string | null
          asset_id: number
          disposal_date?: string
          disposal_id?: never
          disposal_method: string
          inspection_date?: string | null
          previous_status?: string | null
          remarks?: string | null
          status?: string
        }
        Update: {
          appraisal_value?: number | null
          approved_by?: string | null
          asset_id?: number
          disposal_date?: string
          disposal_id?: never
          disposal_method?: string
          inspection_date?: string | null
          previous_status?: string | null
          remarks?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disposal_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      ics_records: {
        Row: {
          asset_id: number
          assignment_id: number | null
          ics_id: number
          ics_no: string
          issue_date: string
          issued_by: string | null
          officer_id: number | null
          remarks: string | null
        }
        Insert: {
          asset_id: number
          assignment_id?: number | null
          ics_id?: never
          ics_no: string
          issue_date?: string
          issued_by?: string | null
          officer_id?: number | null
          remarks?: string | null
        }
        Update: {
          asset_id?: number
          assignment_id?: number | null
          ics_id?: never
          ics_no?: string
          issue_date?: string
          issued_by?: string | null
          officer_id?: number | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ics_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "ics_records_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "asset_assignments"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "ics_records_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ics_records_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "accountable_officers"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      maintenance: {
        Row: {
          asset_id: number
          cost: number | null
          date_reported: string
          maintenance_date: string | null
          maintenance_id: number
          maintenance_type: string
          remarks: string | null
          service_provider: string | null
          status: string
        }
        Insert: {
          asset_id: number
          cost?: number | null
          date_reported?: string
          maintenance_date?: string | null
          maintenance_id?: never
          maintenance_type: string
          remarks?: string | null
          service_provider?: string | null
          status?: string
        }
        Update: {
          asset_id?: number
          cost?: number | null
          date_reported?: string
          maintenance_date?: string | null
          maintenance_id?: never
          maintenance_type?: string
          remarks?: string | null
          service_provider?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      offices: {
        Row: {
          location: string | null
          office_head: string | null
          office_id: number
          office_name: string
        }
        Insert: {
          location?: string | null
          office_head?: string | null
          office_id?: never
          office_name: string
        }
        Update: {
          location?: string | null
          office_head?: string | null
          office_id?: never
          office_name?: string
        }
        Relationships: []
      }
      par_records: {
        Row: {
          asset_id: number
          assignment_id: number | null
          issue_date: string
          issued_by: string | null
          officer_id: number | null
          par_id: number
          par_no: string
          remarks: string | null
        }
        Insert: {
          asset_id: number
          assignment_id?: number | null
          issue_date?: string
          issued_by?: string | null
          officer_id?: number | null
          par_id?: never
          par_no: string
          remarks?: string | null
        }
        Update: {
          asset_id?: number
          assignment_id?: number | null
          issue_date?: string
          issued_by?: string | null
          officer_id?: number | null
          par_id?: never
          par_no?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "par_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "par_records_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "asset_assignments"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "par_records_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "par_records_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "accountable_officers"
            referencedColumns: ["officer_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          favicon_url: string | null
          id: boolean
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          favicon_url?: string | null
          id?: boolean
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          favicon_url?: string | null
          id?: boolean
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          address: string
          age: number
          contact_number: string
          course: string
          email: string
          future_summary: string
          id: number
          name: string
          photo_url: string | null
          sex: string
          sort_order: number
          year_level: string
        }
        Insert: {
          address: string
          age: number
          contact_number: string
          course: string
          email: string
          future_summary: string
          id?: never
          name: string
          photo_url?: string | null
          sex: string
          sort_order?: number
          year_level: string
        }
        Update: {
          address?: string
          age?: number
          contact_number?: string
          course?: string
          email?: string
          future_summary?: string
          id?: never
          name?: string
          photo_url?: string | null
          sex?: string
          sort_order?: number
          year_level?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
