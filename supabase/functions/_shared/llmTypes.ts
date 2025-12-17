// LLM-related types for Culinova recipe generation (Deno-compatible)

export type ComplexityLevel = "simple" | "balanced" | "project";
export type NoveltyLevel = "tried_true" | "fresh_twist" | "adventurous";

export interface UserStyle {
  complexity: ComplexityLevel;
  novelty: NoveltyLevel;
}

export interface StructureTargets {
  ingredientsTargetMin: number;
  ingredientsTargetMax: number;
  stepsTargetMin: number;
  stepsTargetMax: number;
  techniques: "basic_only" | "basic_plus_one" | "advanced_allowed";
  noveltyRules: "no_fusion_no_weird" | "one_optional_twist" | "adventurous_ok";
}

export interface Twist {
  title: string;
  description: string;
  isOptional: boolean;
}

export interface AlignmentNotes {
  readback: string;
  constraintsApplied: string[];
  pantryUsed: string[];
  assumptions: string[];
  tradeoffs: string[];
  quickTweaks: string[];
}

export interface QualityChecks {
  majorIngredientsReferencedInSteps: boolean;
  dietaryCompliance: boolean;
  timeConstraintCompliance: boolean;
  unitSanity: boolean;
  equipmentMatch: boolean;
  warnings: string[];
  usedJsonExtractionFallback?: boolean; // Server-set
  usedRepairPrompt?: boolean; // Server-set when repair prompt was used
}

// Extended interface for AI recipe responses
export interface EnhancedAIRecipeResponse {
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes?: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  equipment: string[];
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
    notes: string;
    group: string;
  }>;
  steps: Array<{
    order: number;
    text: string;
    timerMinutes: number;
    critical: boolean;
    whyItMatters: string;
    checkpoint: string;
  }>;
  tags: string[];
  caloriesPerServing: number;
  imageUrl?: string;
  sourceUrl?: string;

  // New fields for enhanced generation
  twists: Twist[];
  userStyle: UserStyle;
  alignmentNotes: AlignmentNotes;
  qualityChecks: QualityChecks;
}

// Request types for enhanced prompts
export interface EnhancedRecipeRequest {
  concept: string;
  dietary?: string;
  timeConstraint?: string;
  skill?: string;
  cost?: string;
  allowedEquipment?: string[];
  servings?: number;
  userStyle: UserStyle;
  structureTargets: StructureTargets;
  pantryRequired?: Array<{ name: string; quantity?: string }>;
  pantryOptional?: Array<{ name: string; quantity?: string }>;
  pantryInventory?: string[];
}

export interface EnhancedModificationRequest {
  currentRecipeJson: string;
  instructions: string;
  dietary?: string;
  timeConstraint?: string;
  allowedEquipment?: string[];
  userStyle: UserStyle;
  structureTargets: StructureTargets;
}

export interface ShoppingListRequest {
  recipeIngredientsJson: string;
  pantryInventoryJson: string;
  staplesToIgnore?: string[];
}

export interface ShoppingItemEnhanced {
  name: string;
  canonicalName: string;
  quantity?: string;
  category: 'Produce' | 'Meat & Seafood' | 'Dairy & Eggs' | 'Bakery' | 'Pantry' | 'Spices' | 'Beverages' | 'Frozen' | 'Other';
}

export interface ImagePromptRequest {
  title: string;
  description: string;
  topIngredients: string[];
  style?: 'photorealistic' | 'artistic' | 'minimalist';
}

// Validation result type
export interface ValidationResult {
  hardErrors: string[];
  warnings: string[];
  normalized: any;
}
