// Deno-specific imports - may show IDE errors but work correctly at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipeRequest } = await req.json();

    if (!recipeRequest) {
      return new Response(
        JSON.stringify({ success: false, error: 'Recipe request is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });
    
    console.log('✅ Gemini model initialized successfully');

    // Build prompt based on request type
    let prompt: string;
    if (recipeRequest.modificationInstructions && recipeRequest.baseRecipe) {
      // Handle modification request
      prompt = constructModificationPrompt(recipeRequest);
    } else {
      // Handle generation request
      prompt = constructPrompt(recipeRequest);
    }

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    return new Response(
      JSON.stringify({ success: true, response: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in edge function recipe generation:', error);
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
    selectedPantryItemIds
  } = request;

  let prompt = `You are a professional chef. Create a detailed recipe for: "${concept}".

`;

  // Handle custom pantry selection
  if (pantryMode === 'custom_selection' && selectedPantryItemIds && pantryItems) {
    
    // Convert the selectedPantryItemIds object (Map serialized as object) back to usable format
    const selectedMap = selectedPantryItemIds;
    const requiredItems: any[] = [];
    const optionalItems: any[] = [];
    
    // Filter and categorize selected items
    pantryItems.forEach((item: any) => {
      const state = selectedMap[item.id];
      if (state === 'required') {
        requiredItems.push(item);
      } else if (state === 'optional') {
        optionalItems.push(item);
      }
    });
    
    if (requiredItems.length > 0 || optionalItems.length > 0) {
      prompt += PROMPT_TEMPLATES.CUSTOM_PANTRY_HEADER;
      
      if (requiredItems.length > 0) {
        prompt += PROMPT_TEMPLATES.REQUIRED_HEADER;
        requiredItems.forEach(item => {
          const quantity = item.quantity ? ` (${item.quantity})` : '';
          prompt += `- ${item.name}${quantity}\n`;
        });
      }
      
      if (optionalItems.length > 0) {
        prompt += PROMPT_TEMPLATES.OPTIONAL_HEADER;
        optionalItems.forEach(item => {
          const quantity = item.quantity ? ` (${item.quantity})` : '';
          prompt += `- ${item.name}${quantity}\n`;
        });
      }
      
      // Add specific instructions based on what's selected
      if (requiredItems.length > 0 && optionalItems.length > 0) {
        prompt += PROMPT_TEMPLATES.BOTH_TYPES_INSTRUCTIONS;
      } else if (requiredItems.length > 0) {
        prompt += PROMPT_TEMPLATES.REQUIRED_ONLY_INSTRUCTIONS;
      } else {
        prompt += PROMPT_TEMPLATES.OPTIONAL_ONLY_INSTRUCTIONS;
      }
      
      prompt += `\n`;
    }
  }

  // Add constraints in Gemini-preferred format (at the top)
  if (dietaryConstraints && dietaryConstraints.length > 0) {
    const dietaryMap: Record<string, string> = {
      'vegan': 'vegan (no animal products)',
      'vegetarian': 'vegetarian (no meat but may include dairy/eggs)',
      'pescatarian': 'pescatarian (no meat but may include fish/seafood)',
      'gluten-free': 'gluten-free (no wheat, barley, rye)',
      'dairy-free': 'dairy-free (no milk, cheese, yogurt)',
      'nut-free': 'nut-free (no nuts or nut products)',
      'soy-free': 'soy-free (no soy products)',
      'low-sodium': 'low sodium (minimal salt, no high-sodium ingredients)',
      'low-carb': 'low carbohydrate',
      'keto': 'keto-friendly (low carb, high fat)',
      'high-protein': 'high protein (20g+ protein per serving)',
      'no-mayo': 'no mayonnaise or mayonnaise-based ingredients',
      'no-broccoli': 'no broccoli or broccoli-containing ingredients',
      'no-olives': 'no olives or olive products'
    };
    
    const dietaryDescriptions = dietaryConstraints
      .map((id: string) => dietaryMap[id] || id)
      .join(', ');
  }

  if (timeConstraints && timeConstraints.length > 0) {
    const timeMap: Record<string, string> = {
      'under-15': 'total time under 15 minutes',
      'under-30': 'total time under 30 minutes',
      '1-hour': 'total time under 1 hour',
      '5-ingredients': 'maximum 5 main ingredients',
      'one-pot': 'one-pot or one-pan meal (minimal cleanup)',
      'no-cook': 'no cooking required'
    };
    
    const timeDescriptions = timeConstraints
      .map((id: string) => timeMap[id] || id)
      .join(', ');
  }

  if (skillLevel) {
    const skillMap: Record<string, string> = {
      'beginner': 'beginner-friendly (simple techniques, basic equipment)',
      'intermediate': 'intermediate (some experience, standard equipment)',
      'advanced': 'restaurant-quality (complex techniques, special equipment)'
    };
    prompt += `Skill level: ${skillMap[skillLevel] || skillLevel}.\n`;
  }

  if (costPreference) {
    const costMap: Record<string, string> = {
      'cost-conscious': 'budget-friendly with affordable ingredients',
      'standard': 'regular ingredient quality and cost',
      'premium-ingredients': 'high-quality, premium ingredients regardless of cost'
    };
    prompt += `Cost preference: ${costMap[costPreference] || costPreference}.\n`;
  }

  if (excludedIngredients && excludedIngredients.length > 0) {
    prompt += `Exclude these ingredients: ${excludedIngredients.join(', ')}.\n`;
  }

  if (includedIngredients && includedIngredients.length > 0) {
    prompt += `Include these ingredients: ${includedIngredients.join(', ')}.\n`;
  }

  if (cuisineType) {
    prompt += `Cuisine type: ${cuisineType}.\n`;
  }

  if (mealType) {
    prompt += `Meal type: ${mealType}.\n`;
  }

  prompt += `

IMPORTANT constraints:
- Ensure "prepTimeMinutes" and "cookTimeMinutes" are numbers.
- If "pantryItems" are provided, strictly follow the "pantryMode" logic (e.g. if 'strict', do not add extra items).
- Make the recipe practical and realistic.
- Estimate calories per serving based on the ingredients and their quantities. Be realistic but conservative in your estimate.

Respond with ONLY valid JSON matching this exact schema:
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
  "steps": ["string (step 1)", "string (step 2)"],
  "tags": ["string"],
  "caloriesPerServing": number
}`;

  return prompt;
}

function constructModificationPrompt(request: any): string {
  const { baseRecipe, modificationInstructions } = request;

  let prompt = `You are a professional chef. Modify this recipe based on the following instructions.

Current Recipe:
Title: ${baseRecipe.title}
Description: ${baseRecipe.description}
Servings: ${baseRecipe.servings}
Difficulty: ${baseRecipe.difficulty}

Ingredients:
`;

  if (baseRecipe.ingredients && baseRecipe.ingredients.length > 0) {
    baseRecipe.ingredients.forEach((ing: any) => {
      prompt += `- ${ing.amount || ing.quantity || ''} ${ing.unit || ''} ${ing.food_name || ing.name || ''}\n`;
    });
  }

  prompt += `\nSteps:\n`;
  if (baseRecipe.steps && baseRecipe.steps.length > 0) {
    baseRecipe.steps.forEach((step: any, index: number) => {
      prompt += `${index + 1}. ${step.instruction || step}\n`;
    });
  }

  prompt += `\nModification Instructions: ${modificationInstructions}\n\n`;
  prompt += `IMPORTANT: Do NOT include "Undefined" or any placeholder text in the title. Provide a complete, descriptive title for the modified recipe.\n`;
  prompt += `Re-calculate calories per serving based on the modified ingredients and their quantities. Be realistic but conservative in your estimate.\n\n`;
  prompt += `Respond with ONLY valid JSON matching this exact schema:
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
  "steps": ["string (step 1)", "string (step 2)"],
  "tags": ["string"],
  "caloriesPerServing": number
}

Keep the ingredients and steps realistic and practical. Make sure the JSON is valid and properly formatted.`;

  return prompt;
}
