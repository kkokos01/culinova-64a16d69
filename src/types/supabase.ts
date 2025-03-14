
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string
          avatar_url?: string
          preferred_units?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          avatar_url?: string
          preferred_units?: string
          created_at?: string
          updated_at?: string
        }
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
