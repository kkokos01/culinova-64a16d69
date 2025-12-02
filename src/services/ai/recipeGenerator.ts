import { Recipe, Ingredient, Step } from "@/types";
import OpenAI from 'openai';
import { foodUnitMapper } from './foodUnitMapper';

export interface AIRecipeRequest {
  concept: string;
  dietaryConstraints: string[];
  timeConstraints: string[];
  skillLevel: string;
  excludedIngredients: string[];
  spicinessLevel: number;
  targetServings: number;
  cuisinePreference?: string;
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
 * Leverages patterns from existing modification system
 */
export class AIRecipeGenerator {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_AI_API_KEY,
      dangerouslyAllowBrowser: true, // Required for frontend usage
      // Default headers for latest models
      defaultHeaders: {
        'OpenAI-Beta': 'assistants=v2' // Enable latest features
      }
    });
  }
  
  /**
   * Build structured prompt from user constraints
   * Adapted from AIModificationPanel's prompt building logic
   */
  private buildPrompt(request: AIRecipeRequest): string {
    const {
      concept,
      dietaryConstraints,
      timeConstraints,
      skillLevel,
      excludedIngredients,
      spicinessLevel,
      targetServings,
      cuisinePreference
    } = request;

    // Base concept
    let prompt = `Create a recipe for: ${concept}`;
    
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
        'high-protein': 'high protein (20g+ protein per serving)'
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
  async generateRecipe(request: AIRecipeRequest): Promise<AIRecipeResponse | AIRecipeError> {
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
   * Call AI service (OpenAI via Edge Function for both generation and modification)
   */
  private async callAIService(requestOrPrompt: any): Promise<any> {
    try {
      // Route all requests to edge function for consistency and security
      console.log('Calling AI service with request:', requestOrPrompt);
      const response = await this.callOpenAI(requestOrPrompt);
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
   * Call OpenAI API via Supabase Edge Function
   */
  private async callOpenAI(recipeRequest: any): Promise<any> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Calling recipe edge function with request:', recipeRequest);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ recipeRequest })
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
  
  /**
   * Fallback to older model if latest model unavailable
   */
  private async callWithFallbackModel(prompt: string): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chef and recipe developer. Always respond with valid JSON only. Create detailed, practical recipes that users can actually make. Follow the exact JSON structure provided in the prompt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from fallback model');
      }

      console.log('Fallback model response received:', response);
      return JSON.parse(response);
      
    } catch (error: any) {
      console.error('Fallback model also failed:', error);
      return this.getFallbackResponse(prompt);
    }
  }
  
  /**
   * Fallback response for when AI fails
   */
  private getFallbackResponse(prompt: string): any {
    if (prompt.toLowerCase().includes('smoothie')) {
      return {
        title: "High-Protein Berry Smoothie",
        description: "A creamy, nutritious smoothie packed with protein and fresh berries",
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        servings: 2,
        difficulty: "easy",
        ingredients: [
          { name: "Greek yogurt", amount: "1", unit: "cup", notes: "plain or vanilla" },
          { name: "Mixed berries", amount: "1", unit: "cup", notes: "fresh or frozen" },
          { name: "Protein powder", amount: "1", unit: "scoop", notes: "vanilla or unflavored" },
          { name: "Almond milk", amount: "1/2", unit: "cup", notes: "unsweetened" },
          { name: "Spinach", amount: "1", unit: "handful", notes: "optional" }
        ],
        steps: [
          "Add Greek yogurt, berries, protein powder, and almond milk to blender",
          "Add spinach if using for extra nutrients",
          "Blend on high until smooth and creamy, about 30-60 seconds",
          "Taste and adjust consistency with more almond milk if needed",
          "Pour into glasses and serve immediately"
        ],
        tags: ["smoothie", "high-protein", "breakfast", "healthy", "quick"]
      };
    }
    
    // Default fallback recipe
    return {
      title: "Simple Generated Recipe",
      description: "A basic recipe created from your concept",
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      servings: 4,
      difficulty: "medium",
      ingredients: [
        { name: "Main ingredient", amount: "2", unit: "cups" },
        { name: "Secondary ingredient", amount: "1", unit: "tablespoon" },
        { name: "Seasoning", amount: "1", unit: "teaspoon" }
      ],
      steps: [
        "Prepare all ingredients",
        "Cook according to instructions",
        "Serve and enjoy"
      ],
      tags: ["generated", "custom"]
    };
  }
}

// Export singleton instance
export const aiRecipeGenerator = new AIRecipeGenerator();
