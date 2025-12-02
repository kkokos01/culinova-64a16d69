// Deno-specific imports - may show IDE errors but work correctly at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    // Check if this is a modification request
    if (recipeRequest.modificationInstructions && recipeRequest.baseRecipe) {
      // Handle modification request
      const prompt = constructModificationPrompt(recipeRequest);
      
      // Call OpenAI API for modification
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
        },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: 'Professional chef. Modify recipes based on instructions. Respond with valid JSON only using the same format as the original recipe.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '6000'),
          response_format: { type: 'json_object' },
          stream: false
        })
      });

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text();
        console.error('OpenAI API error:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'OpenAI API error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const data = await openaiResponse.json();
      let recipeResponse = data.choices[0]?.message?.content;

      if (!recipeResponse) {
        return new Response(
          JSON.stringify({ success: false, error: 'No response from OpenAI' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Post-process to strip "Undefined" from recipe titles
      try {
        const parsedResponse = JSON.parse(recipeResponse);
        if (parsedResponse.title && typeof parsedResponse.title === 'string') {
          // Remove "Undefined" prefix with any separator (— or -)
          parsedResponse.title = parsedResponse.title.replace(/^Undefined\s*[—-]\s*/i, '').trim();
          recipeResponse = JSON.stringify(parsedResponse);
        }
      } catch (e) {
        // If parsing fails, return original response
        console.log('Could not parse recipe response for title cleanup:', e);
      }

      return new Response(
        JSON.stringify({ success: true, response: recipeResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Handle generation request (existing logic)
    const prompt = constructPrompt(recipeRequest);

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'Professional chef. Create practical recipes. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: parseInt(Deno.env.get('OPENAI_MAX_TOKENS') || '6000'),
        response_format: { type: 'json_object' },
        stream: false
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const response = openaiData.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response content from OpenAI');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: response
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
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
    excludedIngredients, 
    includedIngredients, 
    cuisineType, 
    mealType,
    pantryMode,
    pantryItems,
    selectedPantryItemIds
  } = request;

  let prompt = `Create a detailed recipe for: "${concept}".\n\n`;

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

  if (dietaryConstraints && dietaryConstraints.length > 0) {
    prompt += `Dietary requirements: ${dietaryConstraints.join(', ')}.\n`;
  }

  if (timeConstraints && timeConstraints.length > 0) {
    prompt += `Time constraints: ${timeConstraints.join(', ')}.\n`;
  }

  if (skillLevel) {
    prompt += `Skill level: ${skillLevel}.\n`;
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

  prompt += `\n\nReturn a complete recipe in JSON format with these exact fields:
{
  "title": "Recipe title",
  "description": "Detailed description",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "easy|medium|hard",
  "ingredients": [
    {
      "name": "ingredient name",
      "unit": "measurement unit",
      "amount": "amount as string"
    }
  ],
  "steps": ["step 1", "step 2", "step 3"],
  "tags": ["tag1", "tag2"]
}

Keep the ingredients and steps realistic and practical. Make sure the JSON is valid and properly formatted.`;

  return prompt;
}

function constructModificationPrompt(request: any): string {
  const { baseRecipe, modificationInstructions } = request;

  let prompt = `Modify this recipe based on the following instructions.\n\nCurrent Recipe:\nTitle: ${baseRecipe.title}\nDescription: ${baseRecipe.description}\nServings: ${baseRecipe.servings}\nDifficulty: ${baseRecipe.difficulty}\n\nIngredients:\n`;

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
  prompt += `IMPORTANT: Do NOT include "Undefined" or any placeholder text in the title. Provide a complete, descriptive title for the modified recipe.\n\n`;
  prompt += `Return a complete modified recipe in JSON format with these exact fields:
{
  "title": "Recipe title",
  "description": "Modified description",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "easy|medium|hard",
  "ingredients": [
    {
      "name": "ingredient name",
      "unit": "measurement unit",
      "amount": "amount as string"
    }
  ],
  "steps": ["modified step 1", "modified step 2", "modified step 3"],
  "tags": ["tag1", "tag2"]
}

Keep the ingredients and steps realistic and practical. Make sure the JSON is valid and properly formatted.`;

  return prompt;
}
