
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          title: string
          description: string
          prep_time_minutes: number
          cook_time_minutes: number
          servings: number
          difficulty: 'easy' | 'medium' | 'hard'
          image_url?: string
          user_id: string
          is_public: boolean
          privacy_level: 'private' | 'space' | 'public' | 'shared'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          prep_time_minutes: number
          cook_time_minutes: number
          servings: number
          difficulty: 'easy' | 'medium' | 'hard'
          image_url?: string
          user_id: string
          is_public?: boolean
          privacy_level?: 'private' | 'space' | 'public' | 'shared'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          prep_time_minutes?: number
          cook_time_minutes?: number
          servings?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          image_url?: string
          user_id?: string
          is_public?: boolean
          privacy_level?: 'private' | 'space' | 'public' | 'shared'
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          recipe_id: string
          food_id: string
          unit_id: string
          amount: number
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          food_id: string
          unit_id: string
          amount: number
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          food_id?: string
          unit_id?: string
          amount?: number
          order_index?: number
          created_at?: string
        }
      }
      steps: {
        Row: {
          id: string
          recipe_id: string
          order_number: number
          instruction: string
          duration_minutes?: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          order_number: number
          instruction: string
          duration_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          order_number?: number
          instruction?: string
          duration_minutes?: number
          created_at?: string
        }
      }
      foods: {
        Row: {
          id: string
          name: string
          category?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          created_at?: string
        }
      }
      custom_units: {
        Row: {
          id: string
          space_id: string
          name: string
          plural_name: string
          abbreviation: string
          unit_type: string
          base_unit_id: string
          conversion_to_base: number
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          name: string
          plural_name: string
          abbreviation: string
          unit_type: string
          base_unit_id: string
          conversion_to_base: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          name?: string
          plural_name?: string
          abbreviation?: string
          unit_type?: string
          base_unit_id?: string
          conversion_to_base?: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          name: string
          abbreviation: string
          created_at: string
          unit_type: string
          measurement_system: string
          plural_name: string
          base_unit: boolean
          conversion_to_base?: number
          display_order: number
          formatting_template: string
          common_name?: string
          alternative_names?: string[]
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          abbreviation: string
          created_at?: string
          unit_type: string
          measurement_system: string
          plural_name: string
          base_unit?: boolean
          conversion_to_base?: number
          display_order?: number
          formatting_template?: string
          common_name?: string
          alternative_names?: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          abbreviation?: string
          created_at?: string
          unit_type?: string
          measurement_system?: string
          plural_name?: string
          base_unit?: boolean
          conversion_to_base?: number
          display_order?: number
          formatting_template?: string
          common_name?: string
          alternative_names?: string[]
          updated_at?: string
        }
      }
      unit_conversions: {
        Row: {
          id: string
          from_unit_id: string
          to_unit_id: string
          from_amount: number
          to_amount: number
          food_id?: string
          bidirectional: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_unit_id: string
          to_unit_id: string
          from_amount: number
          to_amount: number
          food_id?: string
          bidirectional?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_unit_id?: string
          to_unit_id?: string
          from_amount?: number
          to_amount?: number
          food_id?: string
          bidirectional?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name?: string
          avatar_url?: string
          preferred_units?: string
          default_unit_system?: 'metric' | 'imperial'
          theme_preference?: 'light' | 'dark' | 'system'
          default_servings?: number
          show_nutritional_info?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string
          avatar_url?: string
          preferred_units?: string
          default_unit_system?: 'metric' | 'imperial'
          theme_preference?: 'light' | 'dark' | 'system'
          default_servings?: number
          show_nutritional_info?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          avatar_url?: string
          preferred_units?: string
          default_unit_system?: 'metric' | 'imperial'
          theme_preference?: 'light' | 'dark' | 'system'
          default_servings?: number
          show_nutritional_info?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          name: string
          created_by: string
          max_recipes: number
          max_users: number
          is_active: boolean
          created_at: string
          is_default: boolean
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          max_recipes?: number
          max_users?: number
          is_active?: boolean
          created_at?: string
          is_default?: boolean
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          max_recipes?: number
          max_users?: number
          is_active?: boolean
          created_at?: string
          is_default?: boolean
        }
      }
      user_spaces: {
        Row: {
          id: string
          user_id: string
          space_id: string
          role: 'admin' | 'editor' | 'viewer'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          role?: 'admin' | 'editor' | 'viewer'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          role?: 'admin' | 'editor' | 'viewer'
          is_active?: boolean
          created_at?: string
        }
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
    }
    Enums: {
      [_ in never]: never
    }
  }
}
