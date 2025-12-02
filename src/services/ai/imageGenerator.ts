import { Recipe } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, Sparkles, RefreshCw, Camera } from "lucide-react";

export interface ImageGenerationRequest {
  recipe: Recipe;
  style?: 'photorealistic' | 'artistic' | 'minimalist';
  aspectRatio?: '1:1' | '4:3' | '16:9';
}

export interface ImageGenerationResponse {
  imageUrl: string;
  prompt: string;
  style: string;
}

export interface ImageGenerationError {
  type: 'api_error' | 'network_error' | 'content_policy' | 'rate_limit' | 'service_error';
  message: string;
  suggestions?: string[];
}

/**
 * Service for AI-powered recipe image generation using Google Imagen
 * via Supabase edge function proxy
 */
export class ImageGenerator {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  /**
   * Generate an image for a recipe using Google Imagen via edge function
   */
  async generateRecipeImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const { recipe, style = 'photorealistic', aspectRatio = '4:3' } = request;
    
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
          },
          body: JSON.stringify({
            recipe,
            style,
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      return {
        imageUrl: data.imageUrl,
        prompt: this.createImagePrompt(request),
        style: request.style || 'photorealistic'
      };
    } catch (error: any) {
      console.error('Error in edge function image generation:', error);
      
      // Convert to standardized error format
      if (error.message.includes('CORS')) {
        throw {
          type: 'network_error' as const,
          message: 'Network error: Unable to connect to image generation service',
          suggestions: ['Check your internet connection', 'Try refreshing the page']
        };
      }
      
      if (error.message.includes('rate limit')) {
        throw {
          type: 'rate_limit' as const,
          message: 'Too many image generation requests. Please try again later.',
          suggestions: ['Wait a few minutes before trying again', 'Consider upgrading to premium for higher limits']
        };
      }
      
      throw {
        type: 'service_error' as const,
        message: error.message || 'Failed to generate image',
        suggestions: ['Check your internet connection', 'Try a different recipe description']
      };
    }
  }

  /**
   * Create a detailed prompt for image generation
   */
  private createImagePrompt(request: ImageGenerationRequest): string {
    const { recipe, style = 'photorealistic', aspectRatio = '4:3' } = request;
    
    // Extract key ingredients (limit to avoid prompt overflow)
    const keyIngredients = recipe.ingredients
      .slice(0, 5)
      .map(ing => {
        if ('food_name' in ing) {
          return ing.food_name;
        } else {
          return ing.food_name; // AIRecipeResponse type also uses food_name
        }
      })
      .filter(name => name && name !== 'unknown ingredient')
      .join(', ');
    
    // Base prompt with recipe title and description
    let prompt = `A professional food photography of ${recipe.title}`;
    
    if (recipe.description) {
      prompt += `, ${recipe.description}`;
    }
    
    if (keyIngredients) {
      prompt += ` featuring ${keyIngredients}`;
    }

    // Style-specific modifications
    switch (style) {
      case 'artistic':
        prompt += ', artistic food photography, creative composition, dramatic lighting, food as art, stylized presentation, artistic food styling';
        break;
      case 'minimalist':
        prompt += ', minimalist food photography, clean composition, simple background, natural lighting, minimal props, focus on food';
        break;
      default: // photorealistic
        prompt += ', photorealistic food photography, natural lighting, restaurant quality presentation, appetizing colors, sharp focus';
    }

    // Technical specifications
    prompt += `, aspect ratio ${aspectRatio}, 4K resolution, HDR, professional photography, high detail, appetizing presentation, food styling`;
    
    return prompt;
  }

  /**
   * Validate image generation request
   */
  validateRequest(request: ImageGenerationRequest): ImageGenerationError | null {
    if (!request.recipe || !request.recipe.title) {
      return {
        type: 'service_error',
        message: 'Recipe title is required for image generation',
        suggestions: ['Ensure your recipe has a title before generating an image']
      };
    }

    if (request.recipe.title.length > 100) {
      return {
        type: 'service_error',
        message: 'Recipe title is too long for image generation',
        suggestions: ['Shorten the recipe title to under 100 characters']
      };
    }

    return null;
  }
}

// Export singleton instance
export const imageGenerator = new ImageGenerator();
