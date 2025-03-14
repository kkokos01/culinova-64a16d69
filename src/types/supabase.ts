
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
      units: {
        Row: {
          id: string
          name: string
          abbreviation: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          abbreviation: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          abbreviation?: string
          created_at?: string
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
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          max_recipes?: number
          max_users?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          max_recipes?: number
          max_users?: number
          is_active?: boolean
          created_at?: string
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
      schema_migrations: {
        Row: {
          version: string
          description: string
          applied_at?: string | null
          success?: boolean | null
          rollback_script?: string | null
        }
        Insert: {
          version: string
          description: string
          applied_at?: string | null
          success?: boolean | null
          rollback_script?: string | null
        }
        Update: {
          version?: string
          description?: string
          applied_at?: string | null
          success?: boolean | null
          rollback_script?: string | null
        }
        Relationships: []
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
  }
}
