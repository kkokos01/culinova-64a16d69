import { Recipe, Ingredient, PantryItem, PantryMode } from "@/types";

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
  pantryItems?: PantryItem[];
  pantryMode?: PantryMode;
  selectedPantryItemIds?: Map<string, 'required' | 'optional'>;
}

export interface AIRecipeModificationRequest {
  baseRecipe: Recipe | AIRecipeResponse; 
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
  caloriesPerServing?: number;
}

export interface AIRecipeError {
  type: 'constraint_conflict' | 'vague_concept' | 'service_error' | 'rate_limit';
  message: string;
  suggestions?: string[];
}

export class AIRecipeGenerator {
  
  constructor() {
    // No initialization needed - purely API based now
  }

  /**
   * Generate recipe using AI service (Edge Function)
   */
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse | AIRecipeError> {
    try {
      console.log('Generating recipe with Gemini...');
      
      if (!request.concept || request.concept.trim().length < 3) {
        return {
          type: 'vague_concept',
          message: 'Please provide a more detailed recipe concept',
          suggestions: ['Describe specific ingredients', 'Mention cuisine preference']
        };
      }
      
      const response = await this.callEdgeFunction(request);
      return this.parseAIResponse(response);

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
   */
  async modifyRecipe(request: AIRecipeModificationRequest): Promise<AIRecipeResponse | AIRecipeError> {
    try {
      console.log('Modifying recipe with Gemini...');
      const response = await this.callEdgeFunction(request);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error modifying recipe:', error);
      return {
        type: 'service_error',
        message: 'Failed to modify recipe.',
        suggestions: ['Check your internet connection']
      };
    }
  }

  /**
   * Centralized method to call Supabase Edge Function
   */
  private async callEdgeFunction(payload: any): Promise<any> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Handle Map serialization for pantry items if present
    const serializedPayload = { ...payload };
    if (payload.selectedPantryItemIds instanceof Map) {
      serializedPayload.selectedPantryItemIds = Object.fromEntries(payload.selectedPantryItemIds);
    }
    if (payload.selectedIngredients instanceof Map) {
      serializedPayload.selectedIngredients = Object.fromEntries(payload.selectedIngredients);
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({ recipeRequest: serializedPayload })
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.response) {
      throw new Error(data.error || 'No response from AI');
    }

    // Gemini returns the JSON as a string in 'response'
    return JSON.parse(data.response);
  }

  private parseAIResponse(response: any): AIRecipeResponse {
    if (!response.title || !response.ingredients || !response.steps) {
      throw new Error('AI response missing required fields');
    }
    return response as AIRecipeResponse;
  }
}

export const aiRecipeGenerator = new AIRecipeGenerator();
