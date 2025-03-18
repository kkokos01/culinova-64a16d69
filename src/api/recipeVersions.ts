
// Re-export all version-related functions from their respective modules
export { fetchRecipeVersions } from './versions/fetchVersions';
export { createRecipeVersion } from './versions/createVersion';
export { setVersionActive, renameVersion, deleteVersion } from './versions/manageVersions';

// Re-export types used by other components - using export type for TypeScript types
export type { 
  RawVersionIngredient, 
  RawVersionStep 
} from "./types/supabaseTypes";

// Re-export utility functions
export { 
  normalizeVersionIngredient,
  normalizeFood,
  normalizeUnit
} from "./types/supabaseTypes";
