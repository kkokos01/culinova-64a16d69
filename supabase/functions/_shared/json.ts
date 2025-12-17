/**
 * JSON parsing utilities for LLM responses
 * Provides robust parsing with fallback extraction for markdown-wrapped JSON
 */

export interface ParseResult<T = any> {
  ok: true;
  value: T;
  usedFallback: boolean;
}

export interface ParseError {
  ok: false;
  error: string;
}

/**
 * Parse JSON with strict validation and fallback extraction
 * 
 * @param raw Raw string response from LLM
 * @returns Parse result with success status, parsed value, and whether fallback was used
 */
export function parseJsonStrict<T = any>(raw: string): ParseResult<T> | ParseError {
  // First try direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    return { ok: true, value: parsed, usedFallback: false };
  } catch (e) {
    // Direct parse failed, try fallback extraction
  }

  // Fallback: Extract JSON from markdown code blocks or plain text
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  
  if (start >= 0 && end > start) {
    const candidate = raw.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      return { ok: true, value: parsed, usedFallback: true };
    } catch (e) {
      return { 
        ok: false, 
        error: `Fallback JSON parse failed: ${(e as Error).message}` 
      };
    }
  }
  
  return { ok: false, error: "No JSON object found in model output." };
}

/**
 * Extract JSON from markdown code blocks
 * 
 * @param raw Raw string that may contain markdown
 * @returns Extracted JSON string or null if not found
 */
export function extractJsonFromMarkdown(raw: string): string | null {
  // Try to match ```json...``` or ```...``` blocks
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = raw.match(jsonBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code blocks, try to find first JSON object
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }
  
  return null;
}

/**
 * Validate that a parsed response matches expected schema structure
 * 
 * @param parsed Parsed JSON object
 * @returns Validation result with any missing required fields
 */
export function validateRecipeSchema(parsed: any): { isValid: boolean; missingFields: string[] } {
  const requiredFields = [
    'title',
    'description',
    'prepTimeMinutes',
    'cookTimeMinutes',
    'servings',
    'difficulty',
    'ingredients',
    'steps',
    'tags',
    'twists',
    'userStyle',
    'alignmentNotes',
    'qualityChecks'
  ];
  
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      missingFields.push(field);
    }
  }
  
  // Validate nested structures
  if (parsed.userStyle && (!parsed.userStyle.complexity || !parsed.userStyle.novelty)) {
    missingFields.push('userStyle.complexity or userStyle.novelty');
  }
  
  if (parsed.alignmentNotes) {
    const alignmentFields = ['readback', 'constraintsApplied', 'pantryUsed', 'assumptions', 'tradeoffs', 'quickTweaks'];
    for (const field of alignmentFields) {
      if (!(field in parsed.alignmentNotes)) {
        missingFields.push(`alignmentNotes.${field}`);
      }
    }
  }
  
  if (parsed.qualityChecks) {
    const qualityFields = ['majorIngredientsReferencedInSteps', 'dietaryCompliance', 'timeConstraintCompliance', 'unitSanity', 'equipmentMatch', 'warnings'];
    for (const field of qualityFields) {
      if (!(field in parsed.qualityChecks)) {
        missingFields.push(`qualityChecks.${field}`);
      }
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}
