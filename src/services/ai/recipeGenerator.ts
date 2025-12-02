import { Recipe, Ingredient, PantryItem, PantryMode } from "@/types";
import { foodUnitMapper } from './foodUnitMapper';
import { logger } from "@/utils/logger";

export interface AIRecipeRequest {
  concept: string;
  dietaryConstraints: string[];
  timeConstraints: string[];
  skillLevel: string;
  costPreference?: string;
  excludedIngredients: string[];
  spicinessLevel: number;
  targetServings: number;
  cuisinePreference?: string;
  // Pantry-related fields
  pantryItems?: PantryItem[];
  pantryMode?: PantryMode;
  selectedPantryItemIds?: Map<string, 'required' | 'optional'>;
}

export interface AIRecipeModificationRequest {
  baseRecipe: Recipe | AIRecipeResponse; // Accept both types for flexibility
  modificationInstructions: string;
  selectedIngredients?: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
}

export interface AIRecipeResponse {
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    notes?: string;
  }>;
  steps: string[];
  tags: string[];
  imageUrl?: string;
}

export interface AIRecipeError {
  type: 'constraint_conflict' | 'vague_concept' | 'service_error' | 'rate_limit';
  message: string;
  suggestions?: string[];
}

/**
 * Service for AI-powered recipe generation
 * Uses Gemini 2.5 Flash via Supabase Edge Function
 */
export class AIRecipeGenerator {
  // OpenAI client removed - now using Gemini via edge function
  
  /**
   * Build structured prompt from user constraints
   * Adapted from AIModificationPanel's prompt building logic
   */
  private buildPrompt(request: AIRecipeRequest): string {
    logger.debug('buildPrompt called', {
      pantryMode: request.pantryMode,
      pantryItemsLength: request.pantryItems?.length || 0,
      selectedPantryItemIdsSize: request.selectedPantryItemIds?.size || 0
    }, 'RecipeGenerator');

    const {
      concept,
      dietaryConstraints,
      timeConstraints,
      skillLevel,
      costPreference,
      excludedIngredients,
      spicinessLevel,
      targetServings,
      cuisinePreference,
      pantryItems = [],
      pantryMode = 'ignore',
      selectedPantryItemIds = new Map()
    } = request;

    // Base concept
    let prompt = `Create a recipe for: ${concept}`;
    
    // Add pantry context if enabled and items exist
    if (pantryMode !== 'ignore' && pantryItems.length > 0) {
      console.log('🔍 DEBUG: Pantry mode:', pantryMode);
      console.log('🔍 DEBUG: Selected items Map:', selectedPantryItemIds);
      console.log('🔍 DEBUG: Selected items size:', selectedPantryItemIds?.size);
      
      if (pantryMode === 'custom_selection' && selectedPantryItemIds && selectedPantryItemIds.size > 0) {
        // Custom selection mode - use only selected items
        const selectedItems = pantryItems.filter(item => selectedPantryItemIds.has(item.id));
        console.log('🔍 DEBUG: Filtered selected items:', selectedItems);
        const groupedPantry = this.groupPantryItems(selectedItems);
        const customPrompt = this.buildCustomSelectionPrompt(groupedPantry, selectedPantryItemIds);
        console.log('🔍 DEBUG: Custom prompt:', customPrompt);
        prompt += customPrompt;
      } else if (pantryMode !== 'custom_selection') {
        // Other pantry modes - use all items with mode-specific logic
        const limitedPantryItems = this.limitPantryItems(pantryItems);
        const groupedPantry = this.groupPantryItems(limitedPantryItems);
        prompt += this.buildPantryPrompt(groupedPantry, pantryMode);
      }
    }

    console.log('🔍 DEBUG: Final prompt before sending to AI:', prompt);
    
    // Add dietary constraints
    if (dietaryConstraints.length > 0) {
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
        .map(id => dietaryMap[id] || id)
        .join(', ');
      prompt += `\nDietary requirements: ${dietaryDescriptions}`;
    }
    
    // Add time constraints
    if (timeConstraints.length > 0) {
      const timeMap: Record<string, string> = {
        'under-15': 'total time under 15 minutes',
        'under-30': 'total time under 30 minutes',
        '1-hour': 'total time under 1 hour',
        '5-ingredients': 'maximum 5 main ingredients',
        'one-pot': 'one-pot or one-pan meal (minimal cleanup)',
        'no-cook': 'no cooking required'
      };
      
      const timeDescriptions = timeConstraints
        .map(id => timeMap[id] || id)
        .join(', ');
      prompt += `\nTime constraints: ${timeDescriptions}`;
    }
    
    // Add skill level
    const skillMap: Record<string, string> = {
      'beginner': 'beginner-friendly (simple techniques, basic equipment)',
      'intermediate': 'intermediate (some experience, standard equipment)',
      'advanced': 'restaurant-quality (complex techniques, special equipment)'
    };
    prompt += `\nSkill level: ${skillMap[skillLevel] || skillLevel}`;
    
    // Add cost preference
    if (costPreference) {
      logger.debug('Adding cost preference to prompt', { costPreference }, 'RecipeGenerator');
      const costMap: Record<string, string> = {
        'cost-conscious': 'budget-friendly with affordable ingredients',
        'standard': 'regular ingredient quality and cost',
        'premium-ingredients': 'high-quality, premium ingredients regardless of cost'
      };
      const costDescription = costMap[costPreference] || costPreference;
      logger.debug('Cost description mapped', { costDescription }, 'RecipeGenerator');
      prompt += `\nCost preference: ${costDescription}`;
    } else {
      logger.debug('No cost preference provided, skipping', {}, 'RecipeGenerator');
    }
    
    // Add exclusions
    if (excludedIngredients.length > 0) {
      prompt += `\nExclude these ingredients: ${excludedIngredients.join(', ')}`;
    }
    
    // Add spiciness
    const spicinessMap = ['mild', 'mildly spicy', 'medium spicy', 'spicy', 'very spicy'];
    prompt += `\nSpiciness level: ${spicinessMap[spicinessLevel - 1] || spicinessLevel}`;
    
    // Add servings
    prompt += `\nServings: ${targetServings}`;
    
    // Add cuisine preference if specified
    if (cuisinePreference) {
      prompt += `\nCuisine style: ${cuisinePreference}`;
    }
    
    // Add concise instructions for AI
    prompt += `\n\nCreate a recipe with these requirements. Respond with ONLY this JSON:
{
  "title": "Recipe name",
  "description": "Brief description",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "easy|medium|hard",
  "ingredients": [{"name": "ingredient", "amount": "quantity", "unit": "unit", "notes": "optional"}],
  "steps": ["step 1", "step 2"],
  "tags": ["tag1", "tag2"]
}

Keep it practical, realistic, and appealing. JSON only.`;

    return prompt;
  }

  /**
   * Limit pantry items to avoid token limits
   * Prioritize by updated_at (freshest first) and balance across storage types
   */
  private limitPantryItems(items: PantryItem[]): PantryItem[] {
    const maxItems = 35; // Conservative limit to avoid token issues
    
    if (items.length <= maxItems) {
      return items;
    }

    // Sort by updated_at (most recent first) and take top items
    return items
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, maxItems);
  }

  /**
   * Group pantry items by storage type for better AI context
   */
  private groupPantryItems(items: PantryItem[]): {
    fresh: PantryItem[];
    staples: PantryItem[];
    frozen: PantryItem[];
  } {
    return {
      fresh: items.filter(item => ['fridge', 'produce'].includes(item.storage_type)),
      staples: items.filter(item => ['pantry', 'spice'].includes(item.storage_type)),
      frozen: items.filter(item => item.storage_type === 'freezer')
    };
  }

  /**
   * Build pantry-specific prompt based on mode and available items
   */
  private buildPantryPrompt(
    groupedPantry: { fresh: PantryItem[]; staples: PantryItem[]; frozen: PantryItem[] },
    pantryMode: PantryMode
  ): string {
    let pantryPrompt = '\n\nPANTRY REQUIREMENTS:\n';
    
    const formatItemList = (items: PantryItem[]): string => {
      return items.map(item => {
        const quantity = item.quantity ? ` (${item.quantity})` : '';
        return `- ${item.name}${quantity}`;
      }).join('\n');
    };

    switch (pantryMode) {
      case 'strict_pantry':
        pantryPrompt += `Use ONLY these ingredients (plus basic staples like water, oil, salt, pepper):\n`;
        if (groupedPantry.fresh.length > 0) {
          pantryPrompt += `\nFresh items:\n${formatItemList(groupedPantry.fresh)}`;
        }
        if (groupedPantry.staples.length > 0) {
          pantryPrompt += `\nPantry staples:\n${formatItemList(groupedPantry.staples)}`;
        }
        if (groupedPantry.frozen.length > 0) {
          pantryPrompt += `\nFrozen items:\n${formatItemList(groupedPantry.frozen)}`;
        }
        pantryPrompt += `\nDo not add any ingredients not listed above (except water, oil, salt, pepper).`;
        break;

      case 'mostly_pantry':
        pantryPrompt += `Prioritize these ingredients, you may add 2-3 additional basic items if needed:\n`;
        if (groupedPantry.fresh.length > 0) {
          pantryPrompt += `\nFresh items (use these first):\n${formatItemList(groupedPantry.fresh)}`;
        }
        if (groupedPantry.staples.length > 0) {
          pantryPrompt += `\nPantry staples:\n${formatItemList(groupedPantry.staples)}`;
        }
        if (groupedPantry.frozen.length > 0) {
          pantryPrompt += `\nFrozen items:\n${formatItemList(groupedPantry.frozen)}`;
        }
        pantryPrompt += `\nYou may add up to 3 additional common ingredients (like onions, garlic, basic seasonings) if essential for the recipe.`;
        break;

      case 'pantry_plus_fresh':
        pantryPrompt += `Use these pantry/spice items as base, suggest fresh produce/meat as needed:\n`;
        if (groupedPantry.staples.length > 0) {
          pantryPrompt += `\nUse these pantry staples:\n${formatItemList(groupedPantry.staples)}`;
        }
        if (groupedPantry.fresh.length > 0) {
          pantryPrompt += `\nConsider these fresh items:\n${formatItemList(groupedPantry.fresh)}`;
        }
        if (groupedPantry.frozen.length > 0) {
          pantryPrompt += `\nFrozen items available:\n${formatItemList(groupedPantry.frozen)}`;
        }
        pantryPrompt += `\nYou may add 3-5 fresh ingredients (proteins, vegetables, herbs) to complete the dish. Focus on using the pantry items as the foundation.`;
        break;

      default:
        return ''; // ignore mode - no pantry prompt
    }

    return pantryPrompt;
  }

  /**
   * Build custom selection prompt using only specifically selected ingredients
   */
  private buildCustomSelectionPrompt(
    groupedPantry: { fresh: PantryItem[]; staples: PantryItem[]; frozen: PantryItem[] },
    selectedItems: Map<string, 'required' | 'optional'>
  ): string {
    let pantryPrompt = '\n\nCUSTOM PANTRY SELECTION:\n';
    
    const formatItemList = (items: PantryItem[]): string => {
      return items.map(item => {
        const quantity = item.quantity ? ` (${item.quantity})` : '';
        return `- ${item.name}${quantity}`;
      }).join('\n');
    };

    // Separate required and optional items
    const requiredItems: PantryItem[] = [];
    const optionalItems: PantryItem[] = [];

    [...groupedPantry.fresh, ...groupedPantry.staples, ...groupedPantry.frozen].forEach(item => {
      const state = selectedItems.get(item.id);
      if (state === 'required') {
        requiredItems.push(item);
      } else if (state === 'optional') {
        optionalItems.push(item);
      }
    });

    if (requiredItems.length > 0) {
      pantryPrompt += `\nREQUIRED ingredients (MUST include these as main components):\n`;
      pantryPrompt += formatItemList(requiredItems);
    }

    if (optionalItems.length > 0) {
      pantryPrompt += `\nOPTIONAL ingredients (use if they enhance the dish - these are nice to have but not essential):\n`;
      pantryPrompt += formatItemList(optionalItems);
    }

    if (requiredItems.length === 0 && optionalItems.length === 0) {
      return '';
    }

    // Build specific instructions based on what's selected
    if (requiredItems.length > 0 && optionalItems.length > 0) {
      pantryPrompt += `\nCreate a recipe that prominently features the REQUIRED ingredients as the main components. Incorporate the OPTIONAL ingredients if they naturally complement the dish and enhance the flavor, but the recipe should still work well without them. Focus on making the required ingredients shine.`;
    } else if (requiredItems.length > 0) {
      pantryPrompt += `\nCreate a recipe that prominently features these REQUIRED ingredients as the main components. You may add basic staples like water, oil, salt, pepper, and up to 2-3 additional common ingredients (like onions, garlic) if essential to complete the dish, but focus on using the required ingredients as the foundation and stars of the recipe.`;
    } else {
      pantryPrompt += `\nCreate a recipe that would be enhanced by these OPTIONAL ingredients. Use them if they naturally complement the dish you're creating. You may add basic staples and other common ingredients as needed to create a complete recipe.`;
    }

    return pantryPrompt;
  }
  
  /**
   * Validate AI response and check for constraint conflicts
   * Adapted from modification system's validation logic
   */
  private validateResponse(response: any, request: AIRecipeRequest): AIRecipeError | null {
    // Check for basic structure
    if (!response.title || !response.ingredients || !response.steps) {
      return {
        type: 'service_error',
        message: 'AI response is incomplete or malformed',
        suggestions: ['Try regenerating with a simpler concept', 'Be more specific about ingredients']
      };
    }
    
    // Check for constraint conflicts
    const hasKeto = request.dietaryConstraints.includes('keto');
    const hasHighCarb = response.ingredients.some((ing: any) => 
      ing.name.toLowerCase().includes('pasta') || 
      ing.name.toLowerCase().includes('rice') ||
      ing.name.toLowerCase().includes('potato')
    );
    
    if (hasKeto && hasHighCarb) {
      return {
        type: 'constraint_conflict',
        message: 'Keto requirement conflicts with high-carb ingredients',
        suggestions: ['Remove keto constraint', 'Request low-carb alternatives']
      };
    }
    
    // Check for vague concepts
    if (request.concept.length < 10 && response.ingredients.length < 3) {
      return {
        type: 'vague_concept',
        message: 'Concept is too vague for a complete recipe',
        suggestions: [
          'Add more details about desired ingredients',
          'Specify cooking style or cuisine',
          'Include dietary preferences or time constraints'
        ]
      };
    }
    
    return null;
  }
  
  /**
   * Process AI response into our database schema
   * Adapted from modification system's response processing
   */
  private processResponse(aiResponse: any): AIRecipeResponse {
    return {
      title: aiResponse.title || 'Generated Recipe',
      description: aiResponse.description || 'A delicious recipe generated by AI',
      prepTimeMinutes: Math.max(5, parseInt(aiResponse.prepTimeMinutes) || 15),
      cookTimeMinutes: Math.max(5, parseInt(aiResponse.cookTimeMinutes) || 30),
      servings: Math.max(1, parseInt(aiResponse.servings) || 4),
      difficulty: ['easy', 'medium', 'hard'].includes(aiResponse.difficulty) 
        ? aiResponse.difficulty as 'easy' | 'medium' | 'hard'
        : 'medium',
      ingredients: Array.isArray(aiResponse.ingredients) ? aiResponse.ingredients : [],
      steps: Array.isArray(aiResponse.steps) ? aiResponse.steps : [],
      tags: Array.isArray(aiResponse.tags) ? aiResponse.tags : [],
      imageUrl: aiResponse.imageUrl
    };
  }
  
  /**
   * Generate recipe using AI service
   * Main method that orchestrates the creation process
   */
  public async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse | AIRecipeError> {
    console.log('🔍 DEBUG: AI Recipe Request received:', request);
    console.log('🔍 DEBUG: selectedPantryItemIds in request:', request.selectedPantryItemIds);
    
    try {
      console.log('Generating recipe with request:', request);
      
      // Validate request
      if (!request.concept || request.concept.trim().length < 3) {
        return {
          type: 'vague_concept',
          message: 'Please provide a more detailed recipe concept',
          suggestions: [
            'Describe specific ingredients you want to use',
            'Mention cooking style or cuisine preference',
            'Include dietary requirements or time constraints'
          ]
        };
      }
      
      // Call AI service (pass request object for edge function)
      const response = await this.callAIService(request);
      
      // Parse response
      const recipeData = this.parseAIResponse(response);
      
      return recipeData;
    } catch (error) {
      console.error('Error generating recipe:', error);
      return {
        type: 'service_error',
        message: 'Failed to generate recipe. Please try again.',
        suggestions: ['Check your internet connection', 'Try a different recipe concept']
      };
    }
  }

  /**
   * Modify existing recipe using AI service
   * Takes a base recipe and modification instructions
   */
  async modifyRecipe(request: AIRecipeModificationRequest): Promise<AIRecipeResponse | AIRecipeError> {
    try {
      console.log('Modifying recipe with request:', request);
      
      // Validate request
      if (!request.baseRecipe) {
        return {
          type: 'service_error',
          message: 'Base recipe is required for modification',
          suggestions: ['Select a recipe to modify']
        };
      }
      
      if (!request.modificationInstructions || request.modificationInstructions.trim().length < 3) {
        return {
          type: 'vague_concept',
          message: 'Please provide more detailed modification instructions',
          suggestions: [
            'Specify which ingredients to change',
            'Describe desired flavor or texture changes',
            'Mention dietary adjustments needed'
          ]
        };
      }
      
      // Send the structured object so the Edge Function recognizes it as a modification
      const response = await this.callAIService(request);
      
      // Parse response
      const recipeData = this.parseAIResponse(response);
      
      return recipeData;
    } catch (error) {
      console.error('Error modifying recipe:', error);
      return {
        type: 'service_error',
        message: 'Failed to modify recipe. Please try again.',
        suggestions: ['Check your internet connection', 'Try different modification instructions']
      };
    }
  }

  /**
   * Build modification prompt from base recipe and instructions
   */
  private buildModificationPrompt(request: AIRecipeModificationRequest): string {
    const { baseRecipe, modificationInstructions, selectedIngredients } = request;
    
    // Handle both Recipe and AIRecipeResponse types
    const title = baseRecipe.title;
    const description = baseRecipe.description;
    const servings = baseRecipe.servings;
    const prepTime = 'prep_time_minutes' in baseRecipe ? baseRecipe.prep_time_minutes : baseRecipe.prepTimeMinutes;
    const cookTime = 'cook_time_minutes' in baseRecipe ? baseRecipe.cook_time_minutes : baseRecipe.cookTimeMinutes;
    const difficulty = baseRecipe.difficulty;
    
    // Handle ingredients for both types
    const ingredients = 'ingredients' in baseRecipe ? baseRecipe.ingredients : [];
    const ingredientList = ingredients.map(ing => {
      if ('food_name' in ing) {
        // Recipe type
        return `- ${ing.amount} ${ing.unit_name || ing.unit?.name || ''} ${ing.food_name || ing.food?.name || 'Unknown ingredient'}`;
      } else {
        // AIRecipeResponse type
        return `- ${ing.amount} ${ing.unit} ${ing.name}`;
      }
    }).join('\n');
    
    // Handle steps for both types
    const steps = 'steps' in baseRecipe ? baseRecipe.steps : [];
    const stepList = steps.map((step, index) => {
      if ('instruction' in step) {
        // Recipe type
        return `${index + 1}. ${step.instruction}`;
      } else {
        // AIRecipeResponse type
        return `${index + 1}. ${step}`;
      }
    }).join('\n');
    
    let prompt = `You are a professional chef. Modify the following recipe based on the user's instructions.

CURRENT RECIPE:
Title: ${title}
Description: ${description}
Servings: ${servings}
Prep time: ${prepTime} minutes
Cook time: ${cookTime} minutes
Difficulty: ${difficulty}

INGREDIENTS:
${ingredientList}

STEPS:
${stepList}

MODIFICATION INSTRUCTIONS:
${modificationInstructions}`;

    if (selectedIngredients && selectedIngredients.size > 0) {
      const ingredientChanges = Array.from(selectedIngredients.entries())
        .map(([_, { ingredient, action }]) => `${action.toUpperCase()}: ${ingredient.food_name || ingredient.food?.name || 'Unknown ingredient'}`)
        .join(', ');
      prompt += `\n\nSPECIFIC INGREDIENT CHANGES: ${ingredientChanges}`;
    }

    prompt += `

Please modify the recipe according to the instructions. Maintain the same overall structure and format. Return a valid JSON object with the following structure:
{
  "title": "Recipe title",
  "description": "Modified recipe description", 
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "easy|medium|hard",
  "ingredients": [
    {"name": "ingredient name", "amount": "amount", "unit": "unit"}
  ],
  "steps": ["step 1", "step 2", "step 3"],
  "tags": ["tag1", "tag2"]
}

Keep the ingredients and steps realistic and practical. Make sure the JSON is valid and properly formatted.`;

    return prompt;
  }

  /**
   * Call AI service (Gemini via Supabase Edge Function)
   */
  private async callAIService(requestOrPrompt: any): Promise<any> {
    try {
      // Route all requests to edge function for consistency and security
      console.log('Calling AI service with request:', requestOrPrompt);
      const response = await this.callEdgeFunction(requestOrPrompt);
      console.log('AI service returned response type:', typeof response);
      console.log('AI service returned response:', response);
      return response;
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }
  }

  /**
   * Parse AI response and validate structure
   */
  private parseAIResponse(response: any): AIRecipeResponse {
    try {
      console.log('Parsing AI response:', response);
      
      // Response is already parsed JSON from callOpenAI
      // Just validate and return it
      if (!response) {
        throw new Error('No response from AI service');
      }
      
      // Validate required fields
      if (!response.title || !response.ingredients || !response.steps) {
        console.error('Invalid response structure:', response);
        throw new Error('AI response missing required fields');
      }
      
      return response as AIRecipeResponse;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  /**
   * Call Gemini API via Supabase Edge Function
   */
  private async callEdgeFunction(recipeRequest: any): Promise<any> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Calling recipe edge function with request:', recipeRequest);
      
      // Convert Map to plain object for JSON serialization
      const serializedRequest = {
        ...recipeRequest,
        selectedPantryItemIds: recipeRequest.selectedPantryItemIds ? 
          Object.fromEntries(recipeRequest.selectedPantryItemIds) : {}
      };
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ recipeRequest: serializedRequest })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Edge function error:', errorData);
        throw new Error(`Edge function error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Edge function response received:', data);

      if (!data.success || !data.response) {
        throw new Error(data.error || 'No response from edge function');
      }

      // Parse JSON response with better error handling
      try {
        const parsedResponse = JSON.parse(data.response);
        console.log('Parsed response:', parsedResponse);
        return parsedResponse;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', data.response);
        throw new Error('Failed to parse recipe response');
      }

    } catch (error) {
      console.error('Error calling recipe edge function:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiRecipeGenerator = new AIRecipeGenerator();
