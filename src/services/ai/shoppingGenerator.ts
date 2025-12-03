import { supabase } from '@/integrations/supabase/client';
import { ShoppingItemCreate, ShoppingCategory } from '@/types';

interface ShoppingGeneratorRequest {
  recipeIngredients: Array<{
    name: string;
    quantity?: string;
  }>;
  pantryItems: Array<{
    name: string;
    quantity?: string;
  }>;
}

interface ShoppingGeneratorResponse {
  items: Array<{
    name: string;
    quantity?: string;
    category: string;
  }>;
  message?: string;
}

/**
 * AI Shopping List Generator
 * Calls the edge function to compare recipe ingredients vs pantry inventory
 * and generate a categorized shopping list of missing items
 */

export const shoppingGenerator = {
  /**
   * Generate shopping list from recipe ingredients and pantry items
   */
  async generateShoppingList(
    recipeIngredients: Array<{ name: string; quantity?: string }>,
    pantryItems: Array<{ name: string; quantity?: string }>,
    fromRecipeId?: string
  ): Promise<{ items: ShoppingItemCreate[], message?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke<ShoppingGeneratorResponse>(
        'generate-shopping-list',
        {
          body: {
            recipeIngredients,
            pantryItems,
            fromRecipeId,
          },
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Failed to generate shopping list. Please try again.');
      }

      if (!data || !data.items) {
        throw new Error('Invalid response from shopping list generator');
      }

      // Convert AI response to ShoppingItemCreate format
      const shoppingItems: ShoppingItemCreate[] = data.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category as ShoppingCategory,
        fromRecipeId,
      }));

      return {
        items: shoppingItems,
        message: data.message,
      };
    } catch (error) {
      console.error('Error generating shopping list:', error);
      throw error;
    }
  },

  /**
   * Extract ingredients from recipe object for AI processing
   */
  extractIngredientsFromRecipe(recipe: any): Array<{ name: string; quantity?: string }> {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      return [];
    }

    return recipe.ingredients.map((ingredient: any) => ({
      name: ingredient.food_name || ingredient.name || 'Unknown ingredient',
      quantity: ingredient.quantity ? 
        `${ingredient.amount || ''} ${ingredient.unit_name || ''}`.trim() : 
        undefined,
    }));
  },

  /**
   * Extract pantry items for AI processing
   */
  extractPantryItems(pantryItems: any[]): Array<{ name: string; quantity?: string }> {
    if (!Array.isArray(pantryItems)) {
      return [];
    }

    return pantryItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
    }));
  },

  /**
   * Validate and clean generated shopping items
   */
  validateShoppingItems(items: ShoppingItemCreate[]): ShoppingItemCreate[] {
    const validCategories: ShoppingCategory[] = [
      'Produce',
      'Meat & Seafood', 
      'Dairy & Eggs',
      'Bakery',
      'Pantry',
      'Spices',
      'Beverages',
      'Frozen',
      'Other'
    ];

    return items.filter((item) => {
      return (
        item &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0 &&
        (!item.category || validCategories.includes(item.category))
      );
    }).map((item) => ({
      name: item.name.trim(),
      quantity: item.quantity?.trim() || undefined,
      category: item.category && validCategories.includes(item.category) 
        ? item.category 
        : 'Other',
    }));
  },
};
