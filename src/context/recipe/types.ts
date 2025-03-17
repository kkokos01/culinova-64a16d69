
import { Recipe, Ingredient } from "@/types";

// Define the version type
export interface RecipeVersion {
  id: string;
  name: string;
  recipe: Recipe;
  isActive: boolean;
  isTemporary?: boolean; // Flag to indicate if version is temporary (not saved to DB)
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
  isLoadingVersions: boolean;
  fetchVersionsFromDb: (recipeId: string) => Promise<RecipeVersion[]>;
  addRecipeVersion: (name: string, recipe: Recipe) => Promise<RecipeVersion>;
  addTemporaryVersion: (name: string, recipe: Recipe) => RecipeVersion; // New function for temporary versions
  persistVersion: (versionId: string) => Promise<RecipeVersion>; // New function to persist temporary version
  setActiveVersion: (versionId: string) => Promise<void>;
  renameVersion: (versionId: string, newName: string) => Promise<void>;
  deleteVersion: (versionId: string) => Promise<void>;
  hasInitializedVersions: boolean;
  setHasInitializedVersions: (initialized: boolean) => void;
  isAiModifying: boolean;
  setIsAiModifying: (isModifying: boolean) => void;
  handleStartModification: (modificationType: string) => void;
}
