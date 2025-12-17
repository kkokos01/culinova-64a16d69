import type { UserStyle, StructureTargets } from './llmTypes.ts';

/**
 * Maps user style preferences to concrete recipe structure targets
 * This ensures the AI has clear numeric targets to follow
 */
export function getStructureTargets(userStyle: UserStyle): StructureTargets {
  const complexity = userStyle.complexity;
  const novelty = userStyle.novelty;

  // Base targets based on complexity level
  const base = complexity === "simple"
    ? {
        ingredientsTargetMin: 6,
        ingredientsTargetMax: 10,
        stepsTargetMin: 5,
        stepsTargetMax: 8,
        techniques: "basic_only" as const,
      }
    : complexity === "balanced"
    ? {
        ingredientsTargetMin: 9,
        ingredientsTargetMax: 14,
        stepsTargetMin: 7,
        stepsTargetMax: 11,
        techniques: "basic_plus_one" as const,
      }
    : {
        ingredientsTargetMin: 12,
        ingredientsTargetMax: 18,
        stepsTargetMin: 10,
        stepsTargetMax: 16,
        techniques: "advanced_allowed" as const,
      };

  // Novelty rules based on novelty level
  const noveltyRules: StructureTargets["noveltyRules"] =
    novelty === "tried_true"
      ? "no_fusion_no_weird"
      : novelty === "fresh_twist"
      ? "one_optional_twist"
      : "adventurous_ok";

  return { ...base, noveltyRules };
}

/**
 * Validates that a recipe response adheres to the structure targets
 */
export function validateAgainstTargets(
  ingredientCount: number,
  stepCount: number,
  targets: StructureTargets
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Check ingredient count
  if (ingredientCount < targets.ingredientsTargetMin) {
    violations.push(
      `Too few ingredients: ${ingredientCount} (minimum ${targets.ingredientsTargetMin})`
    );
  }
  if (ingredientCount > targets.ingredientsTargetMax) {
    violations.push(
      `Too many ingredients: ${ingredientCount} (maximum ${targets.ingredientsTargetMax})`
    );
  }

  // Check step count
  if (stepCount < targets.stepsTargetMin) {
    violations.push(
      `Too few steps: ${stepCount} (minimum ${targets.stepsTargetMin})`
    );
  }
  if (stepCount > targets.stepsTargetMax) {
    violations.push(
      `Too many steps: ${stepCount} (maximum ${targets.stepsTargetMax})`
    );
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Gets a human-readable description of the style targets
 */
export function getStyleDescription(userStyle: UserStyle): string {
  const targets = getStructureTargets(userStyle);
  
  const complexityDesc = 
    userStyle.complexity === "simple" ? "Simple & Quick" :
    userStyle.complexity === "balanced" ? "Balanced" :
    "Project Meal";
  
  const noveltyDesc =
    userStyle.novelty === "tried_true" ? "Tried & True" :
    userStyle.novelty === "fresh_twist" ? "Fresh Twist" :
    "Adventurous";
  
  return `${complexityDesc} with ${novelDesc} style (${targets.ingredientsTargetMin}-${targets.ingredientsTargetMax} ingredients, ${targets.stepsTargetMin}-${targets.stepsTargetMax} steps)`;
}
