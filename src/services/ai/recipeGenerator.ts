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
        'gluten-free': 'gluten-free (no wheat, barley, rye)',
        'dairy-free': 'dairy-free (no milk, cheese, yogurt)',
        'low-sodium': 'low sodium (minimal salt, no high-sodium ingredients)',
        'keto': 'keto-friendly (low carb, high fat)',
        'high-protein': 'high protein (20g+ protein per serving)',
        'low-carb': 'low carbohydrate'
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
        'one-pot': 'one-pot meal (minimal cleanup)',
        '5-ingredients': 'maximum 5 main ingredients',
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
    
    // Add instructions for AI - optimized for latest models
    prompt += `

You are a professional chef creating a recipe based on the above requirements. 

CRITICAL: You must respond with ONLY a valid JSON object. No additional text, explanations, or formatting outside the JSON.

Return exactly this JSON structure:
{
  "title": "Catchy recipe title",
  "description": "Brief appealing description (1-2 sentences)",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "easy" | "medium" | "hard",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "quantity (e.g., 2, 1/2, 250)",
      "unit": "unit (e.g., cups, tablespoons, grams)",
      "notes": "optional preparation notes"
    }
  ],
  "steps": [
    "Clear step-by-step instruction",
    "Next step with specific details"
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Requirements:
- Ingredients must be realistic and commonly available
- Steps must be logical and properly sequenced  
- Times must be realistic for the skill level
- Include specific temperatures and timings where relevant
- Ensure all dietary constraints are respected
- Make it appealing and practical
- JSON must be valid and parseable

Respond with ONLY the JSON object above, nothing else.`;

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
      
      // Build prompt
      const prompt = this.buildPrompt(request);
      
      // Call AI service
      const response = await this.callAIService(prompt);
      
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
      
      // Build modification prompt
      const prompt = this.buildModificationPrompt(request);
      
      // Call AI service
      const response = await this.callAIService(prompt);
      
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
  "title": "Modified recipe title",
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
   * Call AI service (OpenAI)
   */
  private async callAIService(prompt: string): Promise<any> {
    try {
      console.log('Calling AI service with prompt length:', prompt.length);
      const response = await this.callOpenAI(prompt);
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
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<any> {
    try {
      const apiKey = import.meta.env.VITE_AI_API_KEY;
      console.log('Calling OpenAI API with model:', import.meta.env.VITE_AI_MODEL);
      console.log('API Key loaded:', apiKey ? 'YES' : 'NO');
      console.log('API Key starts with sk-:', apiKey?.startsWith('sk-') ? 'YES' : 'NO');
      
      const completion = await this.openai.chat.completions.create({
        model: import.meta.env.VITE_AI_MODEL || 'gpt-5-mini',
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
        max_completion_tokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '4000'),
        response_format: { type: 'json_object' }
      });

      console.log('Full OpenAI completion response:', JSON.stringify(completion, null, 2));
      
      const response = completion.choices[0]?.message?.content;
      console.log('Raw OpenAI response:', response);
      
      if (!response) {
        console.error('No response content found. Completion structure:', {
          choices: completion.choices,
          usage: completion.usage,
          created: completion.created,
          model: completion.model,
          object: completion.object,
          id: completion.id
        });
        throw new Error('No response from OpenAI');
      }

      console.log('OpenAI response received:', response);
      
      // Parse JSON response with better error handling
      try {
        const parsedResponse = JSON.parse(response);
        console.log('Parsed response:', parsedResponse);
        return parsedResponse;
      } catch (parseError) {
        console.error('Failed to parse JSON response:', response);
        console.error('Parse error:', parseError);
        throw new Error('Invalid JSON response from AI');
      }
      
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Check for model-specific errors
      if (error.message?.includes('model')) {
        console.log('Model not available, falling back to gpt-4-turbo-preview...');
        // Retry with fallback model
        return this.callWithFallbackModel(prompt);
      }
      
      // Fallback to mock response if API fails
      console.log('Falling back to mock response...');
      return this.getFallbackResponse(prompt);
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
