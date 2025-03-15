

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  preferred_units?: string;
  default_unit_system?: 'metric' | 'imperial';
  theme_preference?: 'light' | 'dark' | 'system';
  default_servings?: number;
  show_nutritional_info?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  created_by: string;
  max_recipes: number;
  max_users: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface UserSpace {
  id: string;
  user_id: string;
  space_id: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  space?: Space;
}

export interface FoodCategory {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  group_name?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  custom_name?: string; // From space_category_settings
  custom_icon_url?: string; // From space_category_settings
  custom_order?: number; // From space_category_settings
  is_enabled?: boolean; // From space_category_settings
}

export interface Food {
  id: string;
  space_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  category_id?: string;
  path?: string; // LTREE represented as string in the frontend
  properties?: Record<string, any>;
  inheritable_properties?: Record<string, any>;
  tags?: string[];
  default_unit_id?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: FoodCategory;
  parent?: Food;
  children?: Food[];
  properties_list?: FoodProperty[];
  default_unit?: Unit;
}

export type PropertyType = 
  | 'calories'
  | 'protein'
  | 'fat'
  | 'carbohydrates'
  | 'fiber'
  | 'sugar'
  | 'sodium'
  | 'vitamin_a'
  | 'vitamin_c'
  | 'calcium'
  | 'iron';

export interface FoodProperty {
  id: string;
  food_id: string;
  property_type: PropertyType;
  value: number;
  unit_id?: string;
  unit?: Unit;
  per_amount: number;
  per_unit_id?: string;
  per_unit?: Unit;
  source?: string;
  confidence_score?: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  unit_type: string;
  measurement_system: string;
  plural_name: string;
  base_unit: boolean;
  conversion_to_base?: number;
  display_order: number;
  formatting_template: string;
  common_name?: string;
  alternative_names?: string[];
}

export interface Ingredient {
  id: string;
  food_id: string;
  unit_id: string;
  amount: number;
  food?: Food;
  unit?: Unit;
}

export interface Step {
  id: string;
  recipe_id: string;
  order_number: number;
  instruction: string;
  duration_minutes?: number;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_public: boolean;
  privacy_level: 'private' | 'space' | 'public' | 'shared';
  created_at: string;
  updated_at: string;
  tags?: string[];
  ingredients?: Ingredient[];
  steps?: Step[];
  user?: User;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items?: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  food_id: string;
  unit_id: string;
  amount: number;
  is_completed: boolean;
  food?: Food;
  unit?: Unit;
}

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  meals?: Meal[];
}

export interface Meal {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  recipe?: Recipe;
}

