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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_items: {
        Row: {
          ad_type: string
          ads_config_id: string
          created_at: string
          duration: number
          fit_mode: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          ad_type?: string
          ads_config_id: string
          created_at?: string
          duration?: number
          fit_mode?: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          ad_type?: string
          ads_config_id?: string
          created_at?: string
          duration?: number
          fit_mode?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_items_ads_config_id_fkey"
            columns: ["ads_config_id"]
            isOneToOne: false
            referencedRelation: "ads_config"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_config: {
        Row: {
          ads: Json
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          ads?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          ads?: Json
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_config_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_config: {
        Row: {
          created_at: string
          id: string
          pix_key: string
          recipient_city: string
          recipient_name: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pix_key: string
          recipient_city: string
          recipient_name: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pix_key?: string
          recipient_city?: string
          recipient_name?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_config_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          pix_code: string
          session_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          pix_code: string
          session_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          pix_code?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          rest_mode: boolean | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          rest_mode?: boolean | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          rest_mode?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      theme_config: {
        Row: {
          created_at: string
          dark_accent: string | null
          dark_accent_foreground: string | null
          dark_background: string | null
          dark_border: string | null
          dark_button_primary: string | null
          dark_button_primary_foreground: string | null
          dark_button_secondary: string | null
          dark_button_secondary_foreground: string | null
          dark_card: string | null
          dark_card_foreground: string | null
          dark_foreground: string | null
          dark_muted: string | null
          dark_muted_foreground: string | null
          dark_primary: string | null
          dark_primary_foreground: string | null
          dark_secondary: string | null
          dark_secondary_foreground: string | null
          id: string
          light_accent: string | null
          light_accent_foreground: string | null
          light_background: string | null
          light_border: string | null
          light_button_primary: string | null
          light_button_primary_foreground: string | null
          light_button_secondary: string | null
          light_button_secondary_foreground: string | null
          light_card: string | null
          light_card_foreground: string | null
          light_foreground: string | null
          light_muted: string | null
          light_muted_foreground: string | null
          light_primary: string | null
          light_primary_foreground: string | null
          light_secondary: string | null
          light_secondary_foreground: string | null
          session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dark_accent?: string | null
          dark_accent_foreground?: string | null
          dark_background?: string | null
          dark_border?: string | null
          dark_button_primary?: string | null
          dark_button_primary_foreground?: string | null
          dark_button_secondary?: string | null
          dark_button_secondary_foreground?: string | null
          dark_card?: string | null
          dark_card_foreground?: string | null
          dark_foreground?: string | null
          dark_muted?: string | null
          dark_muted_foreground?: string | null
          dark_primary?: string | null
          dark_primary_foreground?: string | null
          dark_secondary?: string | null
          dark_secondary_foreground?: string | null
          id?: string
          light_accent?: string | null
          light_accent_foreground?: string | null
          light_background?: string | null
          light_border?: string | null
          light_button_primary?: string | null
          light_button_primary_foreground?: string | null
          light_button_secondary?: string | null
          light_button_secondary_foreground?: string | null
          light_card?: string | null
          light_card_foreground?: string | null
          light_foreground?: string | null
          light_muted?: string | null
          light_muted_foreground?: string | null
          light_primary?: string | null
          light_primary_foreground?: string | null
          light_secondary?: string | null
          light_secondary_foreground?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dark_accent?: string | null
          dark_accent_foreground?: string | null
          dark_background?: string | null
          dark_border?: string | null
          dark_button_primary?: string | null
          dark_button_primary_foreground?: string | null
          dark_button_secondary?: string | null
          dark_button_secondary_foreground?: string | null
          dark_card?: string | null
          dark_card_foreground?: string | null
          dark_foreground?: string | null
          dark_muted?: string | null
          dark_muted_foreground?: string | null
          dark_primary?: string | null
          dark_primary_foreground?: string | null
          dark_secondary?: string | null
          dark_secondary_foreground?: string | null
          id?: string
          light_accent?: string | null
          light_accent_foreground?: string | null
          light_background?: string | null
          light_border?: string | null
          light_button_primary?: string | null
          light_button_primary_foreground?: string | null
          light_button_secondary?: string | null
          light_button_secondary_foreground?: string | null
          light_card?: string | null
          light_card_foreground?: string | null
          light_foreground?: string | null
          light_muted?: string | null
          light_muted_foreground?: string | null
          light_primary?: string | null
          light_primary_foreground?: string | null
          light_secondary?: string | null
          light_secondary_foreground?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_config_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
