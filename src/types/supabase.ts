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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action_type: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string | null
          id: string
          space_id: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type?: string | null
          id?: string
          space_id?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string | null
          id?: string
          space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
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
      food_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          group_name: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          group_name?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          group_name?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_properties: {
        Row: {
          confidence_score: number | null
          created_at: string
          food_id: string | null
          id: string
          is_verified: boolean | null
          per_amount: number | null
          per_unit_id: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          source: string | null
          unit_id: string | null
          updated_at: string
          value: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          food_id?: string | null
          id?: string
          is_verified?: boolean | null
          per_amount?: number | null
          per_unit_id?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          source?: string | null
          unit_id?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          food_id?: string | null
          id?: string
          is_verified?: boolean | null
          per_amount?: number | null
          per_unit_id?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          source?: string | null
          unit_id?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_properties_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_properties_per_unit_id_fkey"
            columns: ["per_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_properties_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          category_id: string | null
          confidence_score: number | null
          created_at: string
          created_by: string
          default_unit_id: string | null
          description: string | null
          id: string
          inheritable_properties: Json | null
          is_active: boolean | null
          is_validated: boolean | null
          name: string
          parent_id: string | null
          path: unknown
          properties: Json | null
          search_vector_en: unknown
          search_vector_es: unknown
          source: string | null
          space_id: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by: string
          default_unit_id?: string | null
          description?: string | null
          id?: string
          inheritable_properties?: Json | null
          is_active?: boolean | null
          is_validated?: boolean | null
          name: string
          parent_id?: string | null
          path?: unknown
          properties?: Json | null
          search_vector_en?: unknown
          search_vector_es?: unknown
          source?: string | null
          space_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string
          default_unit_id?: string | null
          description?: string | null
          id?: string
          inheritable_properties?: Json | null
          is_active?: boolean | null
          is_validated?: boolean | null
          name?: string
          parent_id?: string | null
          path?: unknown
          properties?: Json | null
          search_vector_en?: unknown
          search_vector_es?: unknown
          source?: string | null
          space_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foods_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foods_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foods_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foods_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          amount: number
          created_at: string
          food_id: string | null
          food_name: string | null
          id: string
          order_index: number | null
          recipe_id: string
          unit_id: string | null
          unit_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          food_id?: string | null
          food_name?: string | null
          id?: string
          order_index?: number | null
          recipe_id: string
          unit_id?: string | null
          unit_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          food_id?: string | null
          food_name?: string | null
          id?: string
          order_index?: number | null
          recipe_id?: string
          unit_id?: string | null
          unit_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          created_at: string
          id: string
          is_staple: boolean | null
          name: string
          quantity: string | null
          space_id: string | null
          storage_type: Database["public"]["Enums"]["storage_type_enum"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_staple?: boolean | null
          name: string
          quantity?: string | null
          space_id?: string | null
          storage_type?: Database["public"]["Enums"]["storage_type_enum"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_staple?: boolean | null
          name?: string
          quantity?: string | null
          space_id?: string | null
          storage_type?: Database["public"]["Enums"]["storage_type_enum"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_version_ingredients: {
        Row: {
          amount: number
          created_at: string
          food_id: string | null
          id: string
          order_index: number
          unit_id: string | null
          version_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          food_id?: string | null
          id?: string
          order_index: number
          unit_id?: string | null
          version_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          food_id?: string | null
          id?: string
          order_index?: number
          unit_id?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_version_ingredients_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_version_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_version_ingredients_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "recipe_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_version_steps: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          instruction: string
          order_number: number
          version_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          instruction: string
          order_number: number
          version_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          instruction?: string
          order_number?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_version_steps_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "recipe_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_versions: {
        Row: {
          created_at: string
          created_by: string
          display_name: string
          id: string
          is_current: boolean
          modification_parameters: Json | null
          modification_type: string
          parent_version_id: string | null
          recipe_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          display_name: string
          id?: string
          is_current?: boolean
          modification_parameters?: Json | null
          modification_type: string
          parent_version_id?: string | null
          recipe_id: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          display_name?: string
          id?: string
          is_current?: boolean
          modification_parameters?: Json | null
          modification_type?: string
          parent_version_id?: string | null
          recipe_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "recipe_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_versions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          cook_time_minutes: number
          created_at: string
          description: string
          difficulty: string
          forked_count: number | null
          id: string
          image_url: string | null
          is_public: boolean
          parent_recipe_id: string | null
          prep_time_minutes: number
          privacy_level: string
          servings: number
          space_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories_per_serving?: number | null
          cook_time_minutes: number
          created_at?: string
          description: string
          difficulty: string
          forked_count?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          parent_recipe_id?: string | null
          prep_time_minutes: number
          privacy_level?: string
          servings: number
          space_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories_per_serving?: number | null
          cook_time_minutes?: number
          created_at?: string
          description?: string
          difficulty?: string
          forked_count?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          parent_recipe_id?: string | null
          prep_time_minutes?: number
          privacy_level?: string
          servings?: number
          space_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_parent_recipe_id_fkey"
            columns: ["parent_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_space_id_fkey"
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
      shopping_list_items: {
        Row: {
          category: string | null
          created_at: string
          from_recipe_id: string | null
          id: string
          is_checked: boolean | null
          name: string
          quantity: string | null
          space_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          from_recipe_id?: string | null
          id?: string
          is_checked?: boolean | null
          name: string
          quantity?: string | null
          space_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          from_recipe_id?: string | null
          id?: string
          is_checked?: boolean | null
          name?: string
          quantity?: string | null
          space_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_from_recipe_id_fkey"
            columns: ["from_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_category_settings: {
        Row: {
          category_id: string | null
          created_at: string
          custom_icon_url: string | null
          custom_name: string | null
          custom_order: number | null
          id: string
          is_enabled: boolean | null
          space_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          custom_icon_url?: string | null
          custom_name?: string | null
          custom_order?: number | null
          id?: string
          is_enabled?: boolean | null
          space_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          custom_icon_url?: string | null
          custom_name?: string | null
          custom_order?: number | null
          id?: string
          is_enabled?: boolean | null
          space_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_category_settings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_category_settings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invitations: {
        Row: {
          created_at: string
          email_address: string
          expires_at: string
          id: string
          inviter_id: string
          message: string | null
          recipient_id: string
          responded_at: string | null
          role: string
          space_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_address: string
          expires_at?: string
          id?: string
          inviter_id: string
          message?: string | null
          recipient_id: string
          responded_at?: string | null
          role: string
          space_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_address?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          message?: string | null
          recipient_id?: string
          responded_at?: string | null
          role?: string
          space_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_invitations_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          is_public: boolean | null
          max_recipes: number
          max_users: number
          member_count: number | null
          name: string
          recipe_count: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_public?: boolean | null
          max_recipes?: number
          max_users?: number
          member_count?: number | null
          name: string
          recipe_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_public?: boolean | null
          max_recipes?: number
          max_users?: number
          member_count?: number | null
          name?: string
          recipe_count?: number | null
        }
        Relationships: []
      }
      steps: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          instruction: string
          order_number: number
          recipe_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          instruction: string
          order_number: number
          recipe_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          instruction?: string
          order_number?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_conversions: {
        Row: {
          bidirectional: boolean
          confidence_score: number | null
          created_at: string
          food_id: string | null
          from_amount: number
          from_unit_id: string
          id: string
          is_verified: boolean | null
          notes: string | null
          source: string | null
          to_amount: number
          to_unit_id: string
          updated_at: string
        }
        Insert: {
          bidirectional?: boolean
          confidence_score?: number | null
          created_at?: string
          food_id?: string | null
          from_amount: number
          from_unit_id: string
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          source?: string | null
          to_amount: number
          to_unit_id: string
          updated_at?: string
        }
        Update: {
          bidirectional?: boolean
          confidence_score?: number | null
          created_at?: string
          food_id?: string | null
          from_amount?: number
          from_unit_id?: string
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          source?: string | null
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
      accept_space_invitation: {
        Args: { invitation_id_param: string }
        Returns: Json
      }
      add_tikka_masala_recipe: { Args: never; Returns: string }
      check_username_availability: {
        Args: { username: string }
        Returns: {
          is_available: boolean
          suggestions: string[]
        }[]
      }
      cleanup_expired_invitations: { Args: never; Returns: number }
      convert_units: {
        Args: {
          input_food_id?: string
          input_from_unit_id: string
          input_to_unit_id: string
          input_value: number
        }
        Returns: number
      }
      create_default_spaces_for_existing_users: { Args: never; Returns: number }
      create_food_catalog_rpcs: { Args: never; Returns: string }
      create_mock_recipes_in_space: {
        Args: {
          count_param?: number
          space_id_param: string
          user_id_param: string
        }
        Returns: string[]
      }
      create_space_for_existing_user: {
        Args: { user_id_param: string }
        Returns: string
      }
      create_user_profile_with_username: {
        Args: { user_id_param: string; username_param: string }
        Returns: boolean
      }
      find_or_create_food: {
        Args: {
          p_category_id?: string
          p_confidence?: number
          p_description?: string
          p_name: string
          p_source?: string
          p_space_id: string
          p_user_id: string
        }
        Returns: {
          confidence_score: number
          food_id: string
          id: string
          is_new: boolean
          is_validated: boolean
          name: string
        }[]
      }
      fix_default_spaces: { Args: never; Returns: number }
      get_auth_users: { Args: { user_ids: string[] }; Returns: string[] }
      get_food_ancestors: {
        Args: { food_path: unknown }
        Returns: {
          category_id: string | null
          confidence_score: number | null
          created_at: string
          created_by: string
          default_unit_id: string | null
          description: string | null
          id: string
          inheritable_properties: Json | null
          is_active: boolean | null
          is_validated: boolean | null
          name: string
          parent_id: string | null
          path: unknown
          properties: Json | null
          search_vector_en: unknown
          search_vector_es: unknown
          source: string | null
          space_id: string | null
          tags: string[] | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "foods"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_food_descendants: {
        Args: { food_path: unknown }
        Returns: {
          category_id: string | null
          confidence_score: number | null
          created_at: string
          created_by: string
          default_unit_id: string | null
          description: string | null
          id: string
          inheritable_properties: Json | null
          is_active: boolean | null
          is_validated: boolean | null
          name: string
          parent_id: string | null
          path: unknown
          properties: Json | null
          search_vector_en: unknown
          search_vector_es: unknown
          source: string | null
          space_id: string | null
          tags: string[] | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "foods"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_recipe_versions: {
        Args: { recipe_id_param: string }
        Returns: {
          created_at: string
          display_name: string
          id: string
          is_current: boolean
          modification_type: string
          recipe_id: string
          version_number: number
        }[]
      }
      get_recipe_with_details: {
        Args: { recipe_id_param: string }
        Returns: {
          cook_time_minutes: number
          created_at: string
          description: string
          difficulty: string
          food_category_id: string
          food_description: string
          food_name: string
          food_properties: Json
          id: string
          image_url: string
          ingredient_amount: number
          ingredient_food_id: string
          ingredient_id: string
          ingredient_order_index: number
          ingredient_unit_id: string
          is_public: boolean
          prep_time_minutes: number
          privacy_level: string
          servings: number
          space_id: string
          step_duration_minutes: number
          step_id: string
          step_instruction: string
          step_order_number: number
          title: string
          unit_abbreviation: string
          unit_name: string
          unit_plural_name: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_default_space: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      invite_user_to_space:
        | {
            Args: {
              email_to_invite: string
              space_id_param: string
              user_role?: string
            }
            Returns: Json
          }
        | {
            Args: {
              email_to_invite: string
              invitation_message?: string
              space_id_param: string
              user_role?: string
            }
            Returns: Json
          }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_member_of_space: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      is_space_admin: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      migrate_recipes_to_default_spaces: { Args: never; Returns: number }
      reject_space_invitation: {
        Args: { invitation_id_param: string }
        Returns: Json
      }
      repair_missing_memberships: { Args: never; Returns: number }
      search_foods: {
        Args: { search_query: string; space_id: string }
        Returns: {
          category_id: string | null
          confidence_score: number | null
          created_at: string
          created_by: string
          default_unit_id: string | null
          description: string | null
          id: string
          inheritable_properties: Json | null
          is_active: boolean | null
          is_validated: boolean | null
          name: string
          parent_id: string | null
          path: unknown
          properties: Json | null
          search_vector_en: unknown
          search_vector_es: unknown
          source: string | null
          space_id: string | null
          tags: string[] | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "foods"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      text2ltree_wrapper: { Args: { text_input: string }; Returns: unknown }
    }
    Enums: {
      measurement_system: "metric" | "imperial" | "universal"
      modification_type: "manual" | "ai" | "dietary" | "scaling" | "time"
      property_type:
        | "calories"
        | "protein"
        | "fat"
        | "carbohydrates"
        | "fiber"
        | "sugar"
        | "sodium"
        | "vitamin_a"
        | "vitamin_c"
        | "calcium"
        | "iron"
      storage_type_enum: "pantry" | "fridge" | "freezer" | "produce" | "spice"
      unit_type: "mass" | "volume" | "count" | "temperature" | "length" | "area"
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
      measurement_system: ["metric", "imperial", "universal"],
      modification_type: ["manual", "ai", "dietary", "scaling", "time"],
      property_type: [
        "calories",
        "protein",
        "fat",
        "carbohydrates",
        "fiber",
        "sugar",
        "sodium",
        "vitamin_a",
        "vitamin_c",
        "calcium",
        "iron",
      ],
      storage_type_enum: ["pantry", "fridge", "freezer", "produce", "spice"],
      unit_type: ["mass", "volume", "count", "temperature", "length", "area"],
    },
  },
} as const
