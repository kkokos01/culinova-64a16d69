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

export interface RecipeImportRequest {
  type: 'url' | 'text';
  content: string;
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
        message: 'Failed to modify recipe. Please try again.',
        suggestions: ['Check your internet connection', 'Try different modification instructions']
      };
    }
  }

  /**
   * Import recipe from URL or text using AI service
   */
  async importRecipe(type: 'url' | 'text', content: string): Promise<AIRecipeResponse | AIRecipeError> {
    try {
      console.log(`Importing recipe via ${type}...`);
      
      if (!content || content.trim().length < 10) {
        return {
          type: 'vague_concept',
          message: 'Please provide a valid URL or recipe text',
          suggestions: ['Paste a recipe URL', 'Copy and paste recipe ingredients and instructions']
        };
      }
      
      const response = await this.callEdgeFunction({
        importRequest: { type, content }
      });
      
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error importing recipe:', error);
      return {
        type: 'service_error',
        message: 'Failed to import recipe. Please check the URL or text.',
        suggestions: ['Try pasting the text directly', 'Check if the URL is accessible']
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
      body: JSON.stringify(serializedPayload)
    });

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.response) {
      throw new Error(data.error || 'No response from AI');
    }

    // Gemini returns the JSON as a string in 'response'
    const parsedResponse = JSON.parse(data.response);
    console.log('AI Response:', JSON.stringify(parsedResponse, null, 2));
    return parsedResponse;
  }

  private parseAIResponse(response: any): AIRecipeResponse {
    if (!response.title || !response.ingredients || !response.steps) {
      throw new Error('AI response missing required fields');
    }
    return response as AIRecipeResponse;
  }
}

export const aiRecipeGenerator = new AIRecipeGenerator();
