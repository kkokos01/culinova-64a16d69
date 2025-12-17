// Deno-specific imports - may show IDE errors but work correctly at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseJsonStrict, validateRecipeSchema } from "../_shared/json.ts";
import { getStructureTargets, validateAgainstTargets } from "../_shared/styleTargets.ts";
import { validateRecipeResponse, shouldRegenerate } from "../_shared/validation.ts";
import { logLLMRun, type LogEntry } from "../_shared/logging.ts";
import type { UserStyle, EnhancedAIRecipeResponse, ValidationResult } from "../_shared/llmTypes.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to find Recipe JSON-LD in HTML text
function extractJsonLd(html: string): any | null {
  try {
    // Regex to capture all json-ld script blocks
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      if (match[1]) {
        try {
          const json = JSON.parse(match[1]);
          // Handle @graph structure (common in WordPress) or direct object
          const data = json['@graph'] || (Array.isArray(json) ? json : [json]);
          
          // Find the object that is a Recipe
          const recipe = data.find((item: any) => 
            item['@type'] === 'Recipe' || 
            (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
          );
          
          if (recipe) return recipe;
        } catch (e) {
          continue; // Malformed JSON in one block, try next
        }
      }
    }
  } catch (e) {
    console.error("JSON-LD extraction error:", e);
  }
  return null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Parse Body (Handle both Request Types)
    const body = await req.json();
    const { recipeRequest, importRequest } = body;
    
    // DEBUG: Log the incoming request
    console.log('🔍 DEBUG: Incoming request body:', JSON.stringify(body, null, 2));
    console.log('🔍 DEBUG: Operation field:', body.operation);
    console.log('🔍 DEBUG: recipeRequest:', recipeRequest ? JSON.stringify(recipeRequest, null, 2) : 'none');

    if (!recipeRequest && !importRequest) {
      throw new Error('Missing recipeRequest or importRequest');
    }

    // Initialize Gemini
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Server misconfiguration: Missing GEMINI_API_KEY');
    }
    
    console.log('🤖 Initializing Gemini 2.5 Flash API...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure Gemini 2.5 Flash for speed
    console.log('⚡ Using gemini-2.5-flash model for fast generation');
    
    // Get operation-based temperature
    const op = (body.operation ?? "generate") as "generate" | "modify" | "import";
    const temperature = getTemperature(op);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: temperature,
      }
    });
    
    console.log('✅ Gemini model initialized successfully for import/generation');

    // Helper function for temperature
    function getTemperature(operation: "generate" | "modify" | "import"): number {
      switch (operation) {
        case "modify":
          return 0.4;
        case "import":
          return 0.2;
        case "generate":
        default:
          return 0.5;
      }
    }

    // Build prompt based on request type
    let prompt: string;
    
    // --- MODE A: IMPORT (URL/TEXT) ---
    if (importRequest) {
      const { type, content } = importRequest;
      let textToAnalyze = content;
      let dataType = "raw text";

      // 1. Fetch URL Content
      if (type === 'url') {
        try {
          console.log(`Fetching URL: ${content}`);
          const urlRes = await fetch(content, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (!urlRes.ok) throw new Error(`Fetch error: ${urlRes.status}`);
          const html = await urlRes.text();

          // 2. Attempt JSON-LD Extraction (The "Golden Path")
          const jsonRecipe = extractJsonLd(html);
          
          if (jsonRecipe) {
            console.log("✅ JSON-LD Recipe found! Using structured data.");
            textToAnalyze = JSON.stringify(jsonRecipe);
            dataType = "structured JSON-LD";
          } else {
            console.log("⚠️ No JSON-LD found. Falling back to HTML parsing.");
            // Increase limit to 100k to ensure we capture bottom-of-page recipes
            textToAnalyze = html.substring(0, 100000); 
            dataType = "webpage HTML";
          }

        } catch (e) {
          console.error("Fetch/Extract failed", e);
          // Fallback is to just pass the URL string itself if fetch blocked
        }
      }

      // 3. The Prompt (Works for both JSON-LD and HTML)
      prompt = `
        You are a Culinary Data Extractor.
        Source Type: ${dataType}
        
        TASK: Extract recipe data into the exact JSON format below.
        
        INPUT DATA:
        ${textToAnalyze}

        GUIDELINES:
        - If the input is JSON-LD, simply map the fields.
        - If the input is HTML, look for "Ingredients" and "Instructions" headers.
        - Clean up strings (remove emoji, "Step 1", ads).
        - Ingredients: Return them as simple strings in "name" if they are unstructured, OR parse if clear.
          (e.g., "1 cup Rice" -> amount: "1", unit: "cup", name: "Rice").
        - Times: Convert "PT1H30M" or "1 hr 30 mins" to total minutes (90).

        RETURN JSON SCHEMA:
        {
          "title": "string",
          "description": "string",
          "prepTimeMinutes": number,
          "cookTimeMinutes": number,
          "servings": number,
          "difficulty": "easy" | "medium" | "hard",
          "ingredients": [ 
            { "name": "string", "amount": "string", "unit": "string", "notes": "string" } 
          ],
          "steps": ["string"],
          "tags": ["string"],
          "caloriesPerServing": number,
          "sourceUrl": "${type === 'url' ? content : ''}"
        }
      `;
    } 
    // --- MODE B: GENERATE/MODIFY (Existing Logic) ---
    else if (op === "modify" || (recipeRequest.modificationInstructions && recipeRequest.baseRecipe)) {
      // Handle modification request
      prompt = constructModificationPrompt(recipeRequest);
    } else {
      // Handle generation request
      prompt = constructPrompt(recipeRequest);
    }

    // Generate content with Gemini
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    const responseTime = Date.now() - startTime;

    if (!rawText) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON with fallback
    const parseResult = parseJsonStrict<EnhancedAIRecipeResponse>(rawText);
    if (!parseResult.ok) {
      console.error('JSON parse failed:', parseResult.error);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    // Validate schema
    const schemaValidation = validateRecipeSchema(parseResult.value);
    if (!schemaValidation.isValid) {
      console.error('Schema validation failed:', schemaValidation.missingFields);
      throw new Error(`Invalid response schema: missing ${schemaValidation.missingFields.join(', ')}`);
    }

    // Validate against targets for enhanced requests
    let validation: ValidationResult = { hardErrors: [], warnings: [], normalized: parseResult.value };
    let finalResponse = parseResult.value;
    let retryAttempted = false;
    
    if (recipeRequest?.userStyle) {
      const targets = getStructureTargets(recipeRequest.userStyle);
      validation = validateRecipeResponse(parseResult.value, targets, {
        userStyle: recipeRequest.userStyle,
        allowedEquipment: recipeRequest.allowedEquipment
      });

      // Set fallback usage flag
      if (parseResult.usedFallback) {
        validation.normalized.qualityChecks = validation.normalized.qualityChecks || {};
        validation.normalized.qualityChecks.usedJsonExtractionFallback = true;
      }

      // If hard errors, attempt one regeneration with repair prompt
      if (validation.hardErrors.length > 0 && !retryAttempted) {
        console.log('Hard validation errors, attempting repair...');
        retryAttempted = true;
        
        const repairPrompt = `
The following JSON response has validation errors:
${JSON.stringify(parseResult.value, null, 2)}

ERRORS TO FIX:
${validation.hardErrors.map(e => `- ${e}`).join('\n')}

Please return a corrected JSON response that fixes these errors.
Keep the same recipe concept and ingredients unless required to fix the errors.
Output ONLY valid JSON. No Markdown. No code fences. No commentary.

CRITICAL RULES:
- If novelty = "tried_true": twists MUST be [].
- If novelty = "fresh_twist": twists MUST contain EXACTLY 1 item with isOptional=true.
- If novelty = "adventurous": twists MUST contain 1-3 items and each must have isOptional=true.
`;

        try {
          console.log('Attempting repair with temperature 0.2...');
          const repairModel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2, // Lowest temperature for repair
            }
          });
          
          const repairResult = await repairModel.generateContent(repairPrompt);
          const repairRaw = repairResult.response.text();
          
          if (repairRaw) {
            const repairParse = parseJsonStrict<EnhancedAIRecipeResponse>(repairRaw);
            if (repairParse.ok) {
              const repairValidation = validateRecipeResponse(repairParse.value, targets, {
                userStyle: recipeRequest.userStyle,
                allowedEquipment: recipeRequest.allowedEquipment
              });
              
              if (repairValidation.hardErrors.length === 0) {
                console.log('Repair successful!');
                validation = repairValidation;
                finalResponse = repairValidation.normalized;
                finalResponse.qualityChecks = finalResponse.qualityChecks || {};
                finalResponse.qualityChecks.usedRepairPrompt = true;
              } else {
                console.log('Repair failed, returning original with errors');
              }
            }
          }
        } catch (repairError) {
          console.error('Repair attempt failed:', repairError);
        }
      }

      // Log to llm_runs table
      try {
        const logEntry: LogEntry = {
          user_id: body.user_id,
          space_id: body.space_id,
          operation: op,
          model: 'gemini-2.5-flash',
          temperature,
          used_json_fallback: parseResult.usedFallback,
          hard_error: validation.hardErrors.length > 0,
          warnings: validation.warnings,
          request_json: recipeRequest,
          response_json: validation.normalized,
          raw_output: parseResult.usedFallback ? rawText : undefined,
          latency_ms: responseTime,
          prompt_version: '2025-12-17-style-v1',
          schema_version: 1
        };
        
        await logLLMRun(logEntry);
      } catch (logError) {
        console.error('Failed to log to llm_runs:', logError);
      }
    }

    console.log('✅ Recipe generated successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        response: JSON.stringify(validation.normalized),
        warnings: validation.warnings,
        usedFallback: parseResult.usedFallback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.log('🤖 Edge function serving recipe generation and import requests - v2');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// AI Prompt Templates - Centralized for easy maintenance
const PROMPT_TEMPLATES = {
  CUSTOM_PANTRY_HEADER: `CUSTOM PANTRY SELECTION:\n`,
  
  REQUIRED_HEADER: `\nREQUIRED ingredients (MUST include these as main components):\n`,
  OPTIONAL_HEADER: `\nOPTIONAL ingredients (use if they enhance the dish - these are nice to have but not essential):\n`,
  
  BOTH_TYPES_INSTRUCTIONS: `\nCreate a recipe that prominently features the REQUIRED ingredients as the main components. Incorporate the OPTIONAL ingredients if they naturally complement the dish and enhance the flavor, but the recipe should still work well without them. Focus on making the required ingredients shine.\n`,
  
  REQUIRED_ONLY_INSTRUCTIONS: `\nCreate a recipe that prominently features these REQUIRED ingredients as the main components. You may add basic staples like water, oil, salt, pepper, and up to 2-3 additional common ingredients (like onions, garlic) if essential to complete the dish, but focus on using the required ingredients as the foundation and stars of the recipe.\n`,
  
  OPTIONAL_ONLY_INSTRUCTIONS: `\nCreate a recipe that would be enhanced by these OPTIONAL ingredients. Use them if they naturally complement the dish you're creating. You may add basic staples and other common ingredients as needed to create a complete recipe.\n`,
};

// Enhanced prompt construction for recipe generation with dials and validation
function constructPrompt(request: any): string {
  const { 
    concept, 
    dietaryConstraints, 
    timeConstraints, 
    skillLevel, 
    costPreference,
    excludedIngredients, 
    includedIngredients, 
    cuisineType, 
    mealType,
    pantryMode,
    pantryItems,
    selectedPantryItemIds,
    userStyle,
    structureTargets
  } = request;

  // Default userStyle if not provided
  const style = userStyle || { complexity: "balanced", novelty: "tried_true" };
  const targets = structureTargets || getStructureTargets(style);

  // Handle custom pantry selection
  let requiredBlock = "";
  let optionalBlock = "";
  let inventoryBlock = "";
  
  if (pantryMode === 'custom_selection' && selectedPantryItemIds && pantryItems) {
    const selectedMap = selectedPantryItemIds;
    const requiredItems: any[] = [];
    const optionalItems: any[] = [];
    
    pantryItems.forEach((item: any) => {
      const state = selectedMap[item.id];
      if (state === 'required') {
        requiredItems.push(item);
      } else if (state === 'optional') {
        optionalItems.push(item);
      }
    });
    
    if (requiredItems.length > 0) {
      requiredBlock = `\nREQUIRED INGREDIENTS (MUST include these as main components):\n${requiredItems
        .map(i => `- ${i.name}${i.quantity ? ` (${i.quantity})` : ""}`)
        .join("\n")}\n`;
    }
    
    if (optionalItems.length > 0) {
      optionalBlock = `\nOPTIONAL INGREDIENTS (use only if they genuinely improve the dish):\n${optionalItems
        .map(i => `- ${i.name}${i.quantity ? ` (${i.quantity})` : ""}`)
        .join("\n")}\n`;
    }
  }

  // Map constraints to prompt-friendly format
  const dietary = dietaryConstraints?.length > 0 ? dietaryConstraints.join(", ") : "none";
  const time = timeConstraints?.length > 0 ? timeConstraints.join(", ") : "not specified";
  const skill = skillLevel || "not specified";
  const cost = costPreference || "not specified";
  const servings = request.servings || 4;

  const constraintsBlock = `
CONSTRAINTS (MUST FOLLOW):
Dietary: ${dietary}
Time: ${time}
Skill level: ${skill}
Cost: ${cost}
SERVINGS: ${servings}
ALLOWED EQUIPMENT: ${request.allowedEquipment?.join(", ") || "not specified"}
`.trim();

  const dialsBlock = `
USER STYLE DIALS (MUST FOLLOW):
- Complexity: ${style.complexity} (simple|balanced|project)
- Novelty: ${style.novelty} (tried_true|fresh_twist|adventurous)

RECIPE STRUCTURE TARGETS (HARD):
- Ingredients count (EXCLUDING staples like salt/oil/water): ${targets.ingredientsTargetMin}–${targets.ingredientsTargetMax}
- Steps count: ${targets.stepsTargetMin}–${targets.stepsTargetMax}
- Techniques: ${targets.techniques}
- Novelty rules: ${targets.noveltyRules}

NOVELTY RULES:
- tried_true: classic, familiar preparation; do NOT introduce fusion; avoid unusual pairings; keep it reliable.
- fresh_twist: include EXACTLY ONE optional twist (clearly labeled) that improves flavor but stays approachable.
- adventurous: bolder flavors/techniques allowed; remain coherent and cookable; no "random weirdness".
`.trim();

  const honestyBlock = `
STRICT HONESTY & COMPLIANCE:
- Only list a pantry item under alignmentNotes.pantryUsed if it appears in the provided pantry inputs (required/optional/inventory).
- If you assume staples (salt, pepper, oil, water), list them under alignmentNotes.assumptions.
- Do not claim you verified nutrition. caloriesPerServing may be an estimate; if so, add an assumption note.
- If constraints conflict, choose the safest interpretation and list the tradeoff in alignmentNotes.tradeoffs.
- Output must be REALISTIC for home cooking and match the allowed equipment.

OUTPUT RULES:
- Output ONLY valid JSON. No Markdown. No code fences. No commentary.
- Use US-friendly measurements by default unless the concept explicitly suggests otherwise.
- Keep ingredient names concise (e.g. "yellow onion", not a full sentence).
- Steps must be short, action-oriented sentences. Each step should be one main action.
- Include timerMinutes on steps where helpful (0 if not applicable).
- Include whyItMatters for only the most important steps (keep it brief).
`.trim();

  const schemaBlock = `
OUTPUT JSON SCHEMA (MUST MATCH EXACTLY):
{
  "title": "string",
  "description": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "totalTimeMinutes": number,
  "servings": number,
  "difficulty": "easy" | "medium" | "hard",
  "equipment": ["string"],
  "ingredients": [
    {
      "name": "string",
      "quantity": "string",
      "unit": "string",
      "notes": "string",
      "group": "string"
    }
  ],
  "steps": [
    {
      "order": number,
      "text": "string",
      "timerMinutes": number,
      "critical": boolean,
      "whyItMatters": "string",
      "checkpoint": "string"
    }
  ],
  "tags": ["string"],
  "caloriesPerServing": number,

  "twists": [
    {
      "title": "string",
      "description": "string",
      "isOptional": boolean
    }
  ],

  "userStyle": {
    "complexity": "simple|balanced|project",
    "novelty": "tried_true|fresh_twist|adventurous"
  },

  "alignmentNotes": {
    "readback": "string",
    "constraintsApplied": ["string"],
    "pantryUsed": ["string"],
    "assumptions": ["string"],
    "tradeoffs": ["string"],
    "quickTweaks": ["string"]
  },

  "qualityChecks": {
    "majorIngredientsReferencedInSteps": boolean,
    "dietaryCompliance": boolean,
    "timeConstraintCompliance": boolean,
    "unitSanity": boolean,
    "equipmentMatch": boolean,
    "warnings": ["string"]
  }
}

TWIST RULES (HARD):
- If novelty = "tried_true": twists MUST be [].
- If novelty = "fresh_twist": twists MUST contain EXACTLY 1 item with isOptional=true.
- If novelty = "adventurous": twists may contain 1–3 optional items.
`.trim();

  return `
You are a professional chef and recipe developer.

TASK:
Create an original, cookable recipe that satisfies the user's concept and constraints.

CONCEPT:
"${concept}"

${requiredBlock}${optionalBlock}${constraintsBlock}

${dialsBlock}

${honestyBlock}

${schemaBlock}
`.trim();
}

// Enhanced prompt construction for recipe modification with dials and validation
function constructModificationPrompt(request: any): string {
  console.log('🔍 DEBUG: constructModificationPrompt called with request type:', typeof request);
  console.log('🔍 DEBUG: request keys:', Object.keys(request || {}));
  
  const { 
    baseRecipe, 
    modificationInstructions,
    userStyle,
    structureTargets,
    dietary,
    timeConstraint,
    allowedEquipment
  } = request;
  
  console.log('🔍 DEBUG: baseRecipe exists:', !!baseRecipe);
  console.log('🔍 DEBUG: modificationInstructions exists:', !!modificationInstructions);
  console.log('🔍 DEBUG: baseRecipe type:', typeof baseRecipe);
  if (baseRecipe) {
    console.log('🔍 DEBUG: baseRecipe keys:', Object.keys(baseRecipe));
  }

  // Default userStyle if not provided
  const style = userStyle || { complexity: "balanced", novelty: "tried_true" };
  const targets = structureTargets || getStructureTargets(style);

  const equipmentBlock = allowedEquipment?.length
    ? `ALLOWED EQUIPMENT (you may ONLY use these): ${allowedEquipment.join(", ")}\n` 
    : `ALLOWED EQUIPMENT: (not specified)\n`;

  const schemaBlock = `
OUTPUT JSON SCHEMA (MUST MATCH EXACTLY):
{
  "title": "string",
  "description": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "totalTimeMinutes": number,
  "servings": number,
  "difficulty": "easy" | "medium" | "hard",
  "equipment": ["string"],
  "ingredients": [
    {
      "name": "string",
      "quantity": "string",
      "unit": "string",
      "notes": "string",
      "group": "string"
    }
  ],
  "steps": [
    {
      "order": number,
      "text": "string",
      "timerMinutes": number,
      "critical": boolean,
      "whyItMatters": "string",
      "checkpoint": "string"
    }
  ],
  "tags": ["string"],
  "caloriesPerServing": number,

  "twists": [
    {
      "title": "string",
      "description": "string",
      "isOptional": boolean
    }
  ],

  "userStyle": {
    "complexity": "simple|balanced|project",
    "novelty": "tried_true|fresh_twist|adventurous"
  },

  "alignmentNotes": {
    "readback": "string",
    "constraintsApplied": ["string"],
    "pantryUsed": ["string"],
    "assumptions": ["string"],
    "tradeoffs": ["string"],
    "quickTweaks": ["string"]
  },

  "qualityChecks": {
    "majorIngredientsReferencedInSteps": boolean,
    "dietaryCompliance": boolean,
    "timeConstraintCompliance": boolean,
    "unitSanity": boolean,
    "equipmentMatch": boolean,
    "warnings": ["string"]
  }
}`;

  return `
You are a professional chef and recipe editor.

TASK:
Modify the given recipe according to the user's instructions while keeping it coherent and cookable.

CURRENT RECIPE (JSON):
${JSON.stringify(baseRecipe, null, 2)}

USER MODIFICATION INSTRUCTIONS:
"${modificationInstructions}"

ADDITIONAL CONSTRAINTS (if any):
Dietary: ${dietary || "none"}
Time: ${timeConstraint || "not specified"}
${equipmentBlock}

USER STYLE DIALS (MUST FOLLOW):
- Complexity: ${style.complexity} (simple|balanced|project)
- Novelty: ${style.novelty} (tried_true|fresh_twist|adventurous)

RECIPE STRUCTURE TARGETS (HARD):
- Ingredients count (excluding staples): ${targets.ingredientsTargetMin}–${targets.ingredientsTargetMax}
- Steps count: ${targets.stepsTargetMin}–${targets.stepsTargetMax}
- Novelty rules: ${targets.noveltyRules}

MODIFICATION RULES (HARD):
- Preserve the dish identity unless the instructions explicitly ask for a different dish.
- Apply the user's requested changes FIRST.
- Then adjust steps/ingredients to meet the complexity target WITHOUT bloating the recipe.
- Respect novelty rules:
  - tried_true: no fusion, no unusual pairings.
  - fresh_twist: EXACTLY ONE optional twist (clearly labeled).
  - adventurous: 1–3 optional twists allowed.
- Output ONLY valid JSON. No Markdown. No commentary.

STRICT HONESTY:
- Do not claim you verified nutrition; calories may be an estimate (note it in assumptions).
- If constraints conflict, choose safest interpretation and list tradeoff in alignmentNotes.tradeoffs.

${schemaBlock}
`.trim();
}
