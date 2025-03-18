
// Re-export all version-related functions from their respective modules
export { fetchRecipeVersions } from './versions/fetchVersions';
export { createRecipeVersion } from './versions/createVersion';
export { setVersionActive, renameVersion, deleteVersion } from './versions/manageVersions';

// Re-export types used by other components
export { 
  RawVersionIngredient, 
  RawVersionStep, 
  normalizeVersionIngredient,
  normalizeFood,
  normalizeUnit
} from "./types/supabaseTypes";
