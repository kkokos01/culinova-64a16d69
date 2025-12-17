/**
 * Validation utilities for recipe responses
 * Implements hard vs soft validation pattern
 */

import type { EnhancedAIRecipeResponse, ValidationResult, UserStyle, StructureTargets } from './llmTypes.ts';

/**
 * Validates recipe response against targets and constraints
 */
export function validateRecipeResponse(
  resp: any,
  targets: StructureTargets,
  input: { userStyle: UserStyle; allowedEquipment?: string[] }
): ValidationResult {
  const warnings: string[] = [];
  const hardErrors: string[] = [];

  // Hard validation: required fields
  if (!resp?.title || typeof resp.title !== "string") {
    hardErrors.push("Missing or invalid title");
  }
  if (!Array.isArray(resp?.ingredients) || resp.ingredients.length === 0) {
    hardErrors.push("Missing or empty ingredients array");
  }
  if (!Array.isArray(resp?.steps) || resp.steps.length === 0) {
    hardErrors.push("Missing or empty steps array");
  }
  if (!resp?.userStyle?.complexity || !resp?.userStyle?.novelty) {
    hardErrors.push("Missing userStyle fields");
  }

  // Hard validation: time sanity
  const prep = Number(resp.prepTimeMinutes);
  const cook = Number(resp.cookTimeMinutes);
  if (!Number.isFinite(prep) || prep < 0 || prep > 600) {
    hardErrors.push("Invalid prepTimeMinutes");
  }
  if (!Number.isFinite(cook) || cook < 0 || cook > 600) {
    hardErrors.push("Invalid cookTimeMinutes");
  }

  // Server compute total if missing
  if (!resp.totalTimeMinutes) {
    resp.totalTimeMinutes = prep + cook;
  }

  // Hard validation: twist rules
  // Use request userStyle as source of truth, not response
  const novelty = input.userStyle?.novelty || resp.userStyle?.novelty;
  
  // Overwrite response userStyle to match request
  resp.userStyle = input.userStyle || resp.userStyle;
  
  if (resp.twists && Array.isArray(resp.twists)) {
    if (novelty === "tried_true" && resp.twists.length > 0) {
      hardErrors.push("tried_true recipes must have empty twists array");
    } else if (novelty === "fresh_twist") {
      if (resp.twists.length !== 1) {
        hardErrors.push("fresh_twist recipes must have exactly 1 twist");
      } else if (resp.twists[0]?.isOptional !== true) {
        hardErrors.push("fresh_twist twist must have isOptional=true");
      }
    } else if (novelty === "adventurous") {
      if (resp.twists.length > 3) {
        hardErrors.push("adventurous recipes can have at most 3 twists");
      }
      const nonOptional = resp.twists.filter((t: any) => t?.isOptional !== true);
      if (nonOptional.length > 0) {
        hardErrors.push("all adventurous twists must have isOptional=true");
      }
    }
  }

  // Soft validation: ingredient/step count targets
  const ingredientCount = resp.ingredients?.length ?? 0;
  if (ingredientCount < targets.ingredientsTargetMin || ingredientCount > targets.ingredientsTargetMax) {
    warnings.push(
      `Ingredient count ${ingredientCount} outside target ${targets.ingredientsTargetMin}-${targets.ingredientsTargetMax}`
    );
  }

  const stepCount = resp.steps?.length ?? 0;
  if (stepCount < targets.stepsTargetMin || stepCount > targets.stepsTargetMax) {
    warnings.push(
      `Step count ${stepCount} outside target ${targets.stepsTargetMin}-${targets.stepsTargetMax}`
    );
  }

  // Soft validation: major ingredient references
  const major = pickMajorIngredients(resp.ingredients || []);
  const stepsText = resp.steps
    ?.map((s: any) => String(s.text || s).toLowerCase())
    .join(" ") || "";
  const missingMajor = major.filter((m) => !stepsText.includes(m.toLowerCase()));
  const majorOk = missingMajor.length <= Math.floor(major.length / 2);
  
  if (!majorOk && major.length > 0) {
    warnings.push(`Major ingredients not referenced in steps: ${missingMajor.join(", ")}`);
  }

  // Ensure qualityChecks exists
  if (!resp.qualityChecks) {
    resp.qualityChecks = {};
  }
  resp.qualityChecks.majorIngredientsReferencedInSteps = majorOk;

  // Equipment validation (soft warning)
  if (Array.isArray(input.allowedEquipment) && Array.isArray(resp.equipment)) {
    const bad = resp.equipment.filter((e: string) => !input.allowedEquipment!.includes(e));
    if (bad.length > 0) {
      warnings.push(`Uses disallowed equipment: ${bad.join(", ")}`);
    }
    resp.qualityChecks.equipmentMatch = bad.length === 0;
  } else {
    resp.qualityChecks.equipmentMatch = true;
  }

  // Set other quality check defaults
  resp.qualityChecks.dietaryCompliance = true;
  resp.qualityChecks.timeConstraintCompliance = true;
  resp.qualityChecks.unitSanity = true;
  resp.qualityChecks.warnings = warnings;

  // Add version tracking
  resp.schemaVersion = 1;
  resp.alignmentNotes = resp.alignmentNotes || {};
  resp.alignmentNotes.promptVersion = "2025-12-17-style-v1";

  return {
    hardErrors,
    warnings,
    normalized: resp
  };
}

/**
 * Picks major ingredients from the list (excluding staples)
 */
function pickMajorIngredients(ingredients: any[]): string[] {
  const staples = new Set([
    "salt", "pepper", "water", "oil", "olive oil", "butter", 
    "flour", "sugar", "garlic", "onion", "garlic powder", "onion powder"
  ]);
  
  const names = ingredients
    .map(i => String(i.name || "").trim())
    .filter(Boolean);
  
  return names
    .filter(n => !staples.has(n.toLowerCase()))
    .slice(0, 3); // Top 3 non-staple ingredients
}

/**
 * Checks if validation errors are critical enough to require regeneration
 */
export function shouldRegenerate(errors: string[], warnings: string[]): boolean {
  // Regenerate on any hard errors
  if (errors.length > 0) {
    return true;
  }
  
  // Don't regenerate for warnings unless they're severe
  const severeWarnings = warnings.filter(w => 
    w.includes("outside target") && 
    (parseInt(w.match(/(\d+)/)?.[1] || "0") > 20) // Very far off target
  );
  
  return severeWarnings.length > 0;
}
