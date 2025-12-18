// Transform layer for converting AI recipe responses to database format
import type { EnhancedAIRecipeResponse, UserStyle } from "../llmTypes";

export type DbInsertPlan = {
  recipeRow: {
    title: string;
    description: string;
    prep_time_minutes: number;
    cook_time_minutes: number;
    servings: number;
    difficulty: "easy" | "medium" | "hard";
    calories_per_serving?: number | null;
    image_url?: string | null;
    user_id: string;
    space_id?: string | null;
    privacy_level: "private" | "space" | "public" | "shared";
    is_public?: boolean;
    source_url?: string | null;
    parent_recipe_id?: string | null;
  };
  stepsRows: Array<{
    recipe_id: string; // fill after recipe insert
    order_number: number;
    instruction: string;
    duration_minutes?: number | null;
  }>;
  ingredientsRows: Array<{
    recipe_id: string; // fill after recipe insert
    amount: number; // numeric NOT NULL
    unit_id?: string | null;
    unit_name?: string | null;
    food_id?: string | null;
    food_name?: string | null;
    order_index: number;
  }>;
  versionRow: {
    recipe_id: string; // fill after recipe insert
    parent_version_id?: string | null;
    version_number: number;
    modification_type: string; // e.g. "generate" | "modify" | "import"
    modification_parameters: any; // JSONB with rich fields
    is_current: boolean;
    created_by: string;
    display_name: string;
  };
};

export function normalizeRecipeForDb(args: {
  ai: EnhancedAIRecipeResponse;
  userId: string;
  spaceId?: string | null;
  privacyLevel?: "private" | "space" | "public" | "shared";
  operation: "generate" | "modify" | "import";
  parentRecipeId?: string | null;
  parentVersionId?: string | null;
  versionNumber: number;
  imageUrl?: string | null;
}): DbInsertPlan {
  const { ai, userId, spaceId, privacyLevel = "private" } = args;

  // HARDEN numeric fields
  const prep = safeInt(ai.prepTimeMinutes, 0);
  const cook = safeInt(ai.cookTimeMinutes, 0);

  const recipeRow = {
    title: ai.title?.trim() || "Untitled Recipe",
    description: ai.description?.trim() || "Recipe created by Culinova.",
    prep_time_minutes: prep,
    cook_time_minutes: cook,
    servings: safeInt(ai.servings, 2),
    difficulty: (ai.difficulty ?? "medium") as "easy" | "medium" | "hard",
    calories_per_serving: Number.isFinite(ai.caloriesPerServing) ? Math.round(ai.caloriesPerServing) : null,
    image_url: args.imageUrl ?? null,
    user_id: userId,
    space_id: spaceId ?? null,
    privacy_level: privacyLevel,
    is_public: false,
    parent_recipe_id: args.parentRecipeId ?? null,
    source_url: (ai as any).sourceUrl ?? null,
  };

  // Steps → DB steps table
  const stepsRows = (ai.steps ?? []).map((s, idx) => ({
    recipe_id: "__RECIPE_ID__", // patched after insert
    order_number: safeInt(s.order ?? idx + 1, idx + 1),
    instruction: String(s.text ?? "").trim(),
    duration_minutes: s.timerMinutes != null ? safeInt(s.timerMinutes, null) : null,
  }));

  // Ingredients → DB ingredients table (numeric amount required)
  const ingredientsRows = (ai.ingredients ?? []).map((ing, idx) => {
    const parsed = parseIngredientQuantity({
      quantity: String(ing.quantity ?? "").trim(),
      unit: ing.unit ? String(ing.unit).trim() : undefined,
    });

    return {
      recipe_id: "__RECIPE_ID__",
      amount: parsed.amount,               // numeric NOT NULL
      unit_id: null,                       // set later if you implement unit lookup
      unit_name: parsed.unitName ?? ing.unit ?? null,
      food_id: null,                       // set later if you implement food lookup
      food_name: String(ing.name ?? "").trim(),
      order_index: idx,
    };
  });

  // All "rich" extras → recipe_versions.modification_parameters JSONB
  const modification_parameters = {
    // Keep exact AI object for auditing/debug:
    aiRaw: ai,

    // Also store a curated subset for easy querying:
    userStyle: ai.userStyle ?? null,
    twists: ai.twists ?? [],
    alignmentNotes: ai.alignmentNotes ?? null,
    qualityChecks: ai.qualityChecks ?? null,
    equipment: ai.equipment ?? [],
    tags: ai.tags ?? [],

    // Preserve rich step/ingredient fields that DB tables can't store:
    richSteps: (ai.steps ?? []).map((s: any) => ({
      order: s.order,
      text: s.text,
      timerMinutes: s.timerMinutes,
      critical: s.critical,
      whyItMatters: s.whyItMatters,
      checkpoint: s.checkpoint,
    })),
    richIngredients: (ai.ingredients ?? []).map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      notes: i.notes,
      group: i.group,
    })),
  };

  const versionRow = {
    recipe_id: "__RECIPE_ID__",
    parent_version_id: args.parentVersionId ?? null,
    version_number: args.versionNumber,
    modification_type: args.operation,
    modification_parameters,
    is_current: true,
    created_by: userId,
    display_name: displayNameFromOp(args.operation, ai.userStyle),
  };

  return { recipeRow, stepsRows, ingredientsRows, versionRow };
}

// helpers
function safeInt(value: any, fallback: any) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (fallback === null) return Math.round(n);
  return Math.max(0, Math.round(n));
}

function displayNameFromOp(op: string, style?: UserStyle) {
  const novelty = style?.novelty ? ` · ${style.novelty}` : "";
  const complexity = style?.complexity ? ` · ${style.complexity}` : "";
  return `${op}${complexity}${novelty}`;
}

export function parseIngredientQuantity(args: { quantity: string; unit?: string }) {
  const raw = (args.quantity || "").trim();

  // Case A: "5-8" → choose first number (5) to satisfy numeric NOT NULL.
  // Also store the original string via JSONB already (richIngredients).
  const rangeMatch = raw.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return { amount: Number(rangeMatch[1]), unitName: args.unit };
  }

  // Case B: starts with number: "1 lb", "2 cups", "0.5 tsp"
  const numMatch = raw.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return { amount: Number(numMatch[1]), unitName: args.unit };
  }

  // Case C: fractions like "1/2"
  const fracMatch = raw.match(/^(\d+)\s*\/\s*(\d+)/);
  if (fracMatch) {
    const a = Number(fracMatch[1]);
    const b = Number(fracMatch[2]);
    if (b !== 0) return { amount: a / b, unitName: args.unit };
  }

  // Case D: unknown → fallback amount=1
  // This is crucial: DB requires numeric NOT NULL.
  return { amount: 1, unitName: args.unit };
}
