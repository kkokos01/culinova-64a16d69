export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      custom_units: {
        Row: {
          abbreviation: string
          base_unit_id: string
          conversion_to_base: number
          created_at: string
          display_order: number
          id: string
          name: string
          plural_name: string
          space_id: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          abbreviation: string
          base_unit_id: string
          conversion_to_base: number
          created_at?: string
          display_order?: number
          id?: string
          name: string
          plural_name: string
          space_id: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          base_unit_id?: string
          conversion_to_base?: number
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          plural_name?: string
          space_id?: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_units_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_units_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          description: string
          rollback_script: string | null
          success: boolean | null
          version: string
        }
        Insert: {
          applied_at?: string | null
          description: string
          rollback_script?: string | null
          success?: boolean | null
          version: string
        }
        Update: {
          applied_at?: string | null
          description?: string
          rollback_script?: string | null
          success?: boolean | null
          version?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_default: boolean
          max_recipes: number
          max_users: number
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_recipes?: number
          max_users?: number
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_recipes?: number
          max_users?: number
          name?: string
        }
        Relationships: []
      }
      unit_conversions: {
        Row: {
          bidirectional: boolean
          created_at: string
          food_id: string | null
          from_amount: number
          from_unit_id: string
          id: string
          to_amount: number
          to_unit_id: string
          updated_at: string
        }
        Insert: {
          bidirectional?: boolean
          created_at?: string
          food_id?: string | null
          from_amount: number
          from_unit_id: string
          id?: string
          to_amount: number
          to_unit_id: string
          updated_at?: string
        }
        Update: {
          bidirectional?: boolean
          created_at?: string
          food_id?: string | null
          from_amount?: number
          from_unit_id?: string
          id?: string
          to_amount?: number
          to_unit_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          alternative_names: string[] | null
          base_unit: boolean
          common_name: string | null
          conversion_to_base: number | null
          created_at: string
          display_order: number
          formatting_template: string | null
          id: string
          measurement_system: Database["public"]["Enums"]["measurement_system"]
          name: string
          plural_name: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          abbreviation: string
          alternative_names?: string[] | null
          base_unit?: boolean
          common_name?: string | null
          conversion_to_base?: number | null
          created_at?: string
          display_order?: number
          formatting_template?: string | null
          id?: string
          measurement_system: Database["public"]["Enums"]["measurement_system"]
          name: string
          plural_name: string
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          alternative_names?: string[] | null
          base_unit?: boolean
          common_name?: string | null
          conversion_to_base?: number | null
          created_at?: string
          display_order?: number
          formatting_template?: string | null
          id?: string
          measurement_system?: Database["public"]["Enums"]["measurement_system"]
          name?: string
          plural_name?: string
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_servings: number | null
          default_unit_system: string | null
          display_name: string | null
          id: string
          preferred_units: string | null
          show_nutritional_info: boolean | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_servings?: number | null
          default_unit_system?: string | null
          display_name?: string | null
          id?: string
          preferred_units?: string | null
          show_nutritional_info?: boolean | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_servings?: number | null
          default_unit_system?: string | null
          display_name?: string | null
          id?: string
          preferred_units?: string | null
          show_nutritional_info?: boolean | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_spaces: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: string
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_spaces_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_units: {
        Args: {
          value: number
          from_unit_id: string
          to_unit_id: string
          food_id?: string
        }
        Returns: number
      }
      create_default_spaces_for_existing_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_space_for_existing_user: {
        Args: {
          user_id_param: string
        }
        Returns: string
      }
      is_member_of_space: {
        Args: {
          _user_id: string
          _space_id: string
        }
        Returns: boolean
      }
      is_space_admin: {
        Args: {
          _user_id: string
          _space_id: string
        }
        Returns: boolean
      }
      repair_missing_memberships: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      measurement_system: "metric" | "imperial" | "universal"
      unit_type: "mass" | "volume" | "count" | "temperature" | "length" | "area"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
