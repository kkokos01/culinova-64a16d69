// Feature flags for Culinova
// These allow gradual rollout of new features

export const FEATURES = {
  // Enable multi-space recipe collections via join table
  SPACE_RECIPES: import.meta.env.VITE_FEATURE_SPACE_RECIPES !== 'false'
};
