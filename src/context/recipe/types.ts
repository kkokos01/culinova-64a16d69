
import { Recipe, Ingredient } from "@/types";

// Define the version type
export interface RecipeVersion {
  id: string;
  name: string;
  recipe: Recipe;
  isActive: boolean;
}

// Define the context type
export interface RecipeContextType {
  recipe: Recipe | null;
  setRecipe: (recipe: Recipe) => void;
  originalRecipe: Recipe | null;
  setOriginalRecipe: (recipe: Recipe) => void;
  selectedIngredient: Ingredient | null;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  selectIngredientForModification: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
  removeIngredientSelection: (id: string) => void;
  customInstructions: string;
  setCustomInstructions: (instructions: string) => void;
  isModified: boolean;
  setIsModified: (isModified: boolean) => void;
  resetToOriginal: () => void;
  recipeVersions: RecipeVersion[];
  activeVersionId: string;
  addRecipeVersion: (name: string, recipe: Recipe) => void;
  setActiveVersion: (versionId: string) => void;
  renameVersion: (versionId: string, newName: string) => void;
  deleteVersion: (versionId: string) => void;
  hasInitializedVersions: boolean;
  setHasInitializedVersions: (initialized: boolean) => void;
}
