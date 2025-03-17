
// Types representing raw data from Supabase queries where
// joined relations might be returned as arrays

export interface RawFood {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  properties?: Record<string, any>;
}

export interface RawUnit {
  id: string;
  name: string;
  abbreviation: string;
  plural_name: string;
}

export interface RawIngredient {
  id: string;
  food_id: string;
  unit_id: string;
  amount: number;
  order_index?: number;
  // Food and unit can be either arrays or objects
  food: RawFood | RawFood[];
  unit: RawUnit | RawUnit[];
}

export interface RawVersionIngredient {
  id: string;
  version_id: string;
  food_id: string;
  unit_id: string;
  amount: number;
  order_index: number;
  // Food and unit can be either arrays or objects
  food: RawFood | RawFood[];
  unit: RawUnit | RawUnit[];
}

export interface RawVersionStep {
  id: string;
  version_id: string;
  order_number: number;
  instruction: string;
  duration_minutes?: number;
}

// Helper function to normalize a raw food object or array to a single food object
export function normalizeFood(food: RawFood | RawFood[] | null | undefined): RawFood | null {
  if (!food) return null;
  if (Array.isArray(food)) {
    return food.length > 0 ? food[0] : null;
  }
  return food;
}

// Helper function to normalize a raw unit object or array to a single unit object
export function normalizeUnit(unit: RawUnit | RawUnit[] | null | undefined): RawUnit | null {
  if (!unit) return null;
  if (Array.isArray(unit)) {
    return unit.length > 0 ? unit[0] : null;
  }
  return unit;
}

// Helper function to normalize a raw ingredient
export function normalizeIngredient(ingredient: RawIngredient): {
  id: string;
  food_id: string;
  unit_id: string;
  amount: number;
  food?: RawFood;
  unit?: RawUnit;
} {
  const normalizedFood = normalizeFood(ingredient.food);
  const normalizedUnit = normalizeUnit(ingredient.unit);
  
  return {
    id: ingredient.id,
    food_id: normalizedFood?.id || ingredient.food_id,
    unit_id: normalizedUnit?.id || ingredient.unit_id,
    amount: ingredient.amount,
    food: normalizedFood || undefined,
    unit: normalizedUnit || undefined
  };
}

// Helper function to normalize a raw version ingredient
export function normalizeVersionIngredient(ingredient: RawVersionIngredient): {
  id: string;
  food_id: string;
  unit_id: string;
  amount: number;
  food?: RawFood;
  unit?: RawUnit;
} {
  const normalizedFood = normalizeFood(ingredient.food);
  const normalizedUnit = normalizeUnit(ingredient.unit);
  
  return {
    id: ingredient.id,
    food_id: normalizedFood?.id || ingredient.food_id,
    unit_id: normalizedUnit?.id || ingredient.unit_id,
    amount: ingredient.amount,
    food: normalizedFood || undefined,
    unit: normalizedUnit || undefined
  };
}
