import { supabase } from '@/integrations/supabase/client';
import { Recipe, RecipeCreate, RecipeUpdate, Ingredient, IngredientCreate, Step, Space, User } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { socialService } from './socialService';
import { useAuth } from '@/context/AuthContext';

/**
 * Helper function to normalize food and unit data from Supabase
 * to handle both array and object forms consistently
 */
const normalizeIngredient = (ingredient: any): Ingredient => {
  // Handle food property - can be array or object
  if (ingredient.food && Array.isArray(ingredient.food)) {
    ingredient.food = ingredient.food[0] || null;
  }
  
  // Handle unit property - can be array or object
  if (ingredient.unit && Array.isArray(ingredient.unit)) {
    ingredient.unit = ingredient.unit[0] || null;
  }
  
  return ingredient as Ingredient;
};

/**
 * Service for handling recipe-related Supabase queries
 * Ensures consistent naming conventions for joined tables
 */
export const recipeService = {
  /**
   * Fetch a recipe with all its details using proper singular naming
   * for joined relations
   */
  async getRecipe(recipeId: string): Promise<Recipe | null> {
    try {
      if (!recipeId) {
        console.warn("No recipe ID provided to recipeService.getRecipe");
        return null;
      }
      
      console.log("Fetching recipe from service:", recipeId);
      
      // Fetch basic recipe data
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();
        
      if (recipeError) {
        throw new Error(`Failed to fetch recipe: ${recipeError.message}`);
      }
      
      if (!recipeData) {
        console.log("No recipe found with ID:", recipeId);
        return null;
      }
      
      // Fetch ingredients with CORRECT SINGULAR naming for joined tables
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select(`
          id, 
          recipe_id,
          food_id,
          unit_id,
          food_name,
          unit_name,
          amount,
          order_index,
          food:food_id(id, name, description, is_validated, confidence_score, source),
          unit:unit_id(id, name, abbreviation)
        `)
        .eq('recipe_id', recipeId);
        
      if (ingredientsError) {
        throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
      }
      
      // Fetch steps
      const { data: steps, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('order_number');
        
      if (stepsError) {
        throw new Error(`Failed to fetch steps: ${stepsError.message}`);
      }
      
      // Log what we found
      console.log("Recipe service found:", {
        recipeData,
        ingredientsCount: ingredientsData?.length || 0,
        stepsCount: steps?.length || 0,
      });
      
      // Normalize ingredients to handle array/object inconsistency
      const normalizedIngredients = ingredientsData ? 
        ingredientsData.map(ingredient => normalizeIngredient(ingredient)) : 
        [];
      
      // Combine into recipe object with correct structure
      const completeRecipe: Recipe = {
        ...recipeData,
        difficulty: recipeData.difficulty as 'easy' | 'medium' | 'hard',
        privacy_level: recipeData.privacy_level as 'public' | 'private' | 'space' | 'shared',
        calories_per_serving: (recipeData as any).calories_per_serving || undefined,
        ingredients: normalizedIngredients,
        steps: steps || [],
        parent_recipe_id: (recipeData as any).parent_recipe_id || undefined,
        forked_count: (recipeData as any).forked_count || 0
      };
      
      return completeRecipe;
    } catch (error) {
      console.error("Error in recipeService.getRecipe:", error);
      throw error;
    }
  },
  
  /**
   * Fetch multiple recipes with filtering options
   */
  async getRecipes(options: {
    userId?: string;
    spaceId?: string;
    isPublic?: boolean;
  } = {}): Promise<Recipe[]> {
    try {
      console.log("Fetching recipes with options:", options);
      
      // Start building the query with optimized field selection
      let query = supabase
        .from('recipes')
        .select('id, title, image_url, description, prep_time_minutes, cook_time_minutes, servings, difficulty, created_at, calories_per_serving, user_id, space_id');
      
      // Apply filtering based on options
      if (options.spaceId) {
        query = query.eq('space_id', options.spaceId);
      } else if (options.userId) {
        query = query.eq('user_id', options.userId);
      } else if (options.isPublic) {
        query = query.eq('is_public', true);
      }
      
      // Execute the query
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }
      
      // Basic validation and filtering
      const validRecipes = data ? data.filter(recipe => 
        recipe && recipe.id && recipe.title
      ) : [];
      
      // Initialize empty arrays for recipes without them
      const processedRecipes = validRecipes.map((recipe: any): Recipe => ({
        ...recipe,
        difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
        privacy_level: recipe.privacy_level as 'public' | 'private' | 'space' | 'shared',
        calories_per_serving: recipe.calories_per_serving || undefined,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        parent_recipe_id: recipe.parent_recipe_id || undefined,
        forked_count: recipe.forked_count || 0
      }));
      
      return processedRecipes as Recipe[];
    } catch (error) {
      console.error("Error in recipeService.getRecipes:", error);
      throw error;
    }
  },
  
  /**
   * Search for a recipe by name
   */
  async findRecipeByName(searchTerm: string): Promise<Recipe | null> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title')
        .ilike('title', `%${searchTerm}%`)
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        return this.getRecipe(data[0].id);
      }
      
      return null;
    } catch (error) {
      console.error("Error in recipeService.findRecipeByName:", error);
      throw error;
    }
  },
  
  /**
   * Create a new recipe with ingredients and steps
   */
  async createRecipe(recipeData: RecipeCreate): Promise<Recipe> {
    try {
      console.log('Creating recipe with data:', recipeData);
      
      // Start a transaction by creating the recipe first
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: recipeData.title,
          description: recipeData.description,
          image_url: recipeData.image_url || null,
          prep_time_minutes: recipeData.prep_time_minutes,
          cook_time_minutes: recipeData.cook_time_minutes,
          servings: recipeData.servings,
          difficulty: recipeData.difficulty,
          is_public: recipeData.is_public || false,
          privacy_level: recipeData.privacy_level || 'private',
          space_id: recipeData.space_id || null,
          user_id: recipeData.user_id,
          calories_per_serving: recipeData.calories_per_serving || null,
          source_url: recipeData.source_url || null,
        })
        .select()
        .single();
        
      if (recipeError) {
        throw new Error(`Failed to create recipe: ${recipeError.message}`);
      }
      
      // Create ingredients if provided
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        const ingredientsWithRecipeId = recipeData.ingredients.map(ingredient => ({
          recipe_id: recipe.id,
          food_id: ingredient.food_id || null,
          unit_id: ingredient.unit_id || null,
          food_name: ingredient.food_name || null,
          unit_name: ingredient.unit_name || null,
          amount: ingredient.amount,
        }));
        
        // Insert all ingredients with text fallbacks
        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(ingredientsWithRecipeId);
          
        if (ingredientsError) {
          // Rollback recipe creation if ingredients fail
          await supabase.from('recipes').delete().eq('id', recipe.id);
          throw new Error(`Failed to create ingredients: ${ingredientsError.message}`);
        }
        
        console.log(`Successfully inserted ${ingredientsWithRecipeId.length} ingredients`);
      }
      
      // Create steps if provided
      if (recipeData.steps && recipeData.steps.length > 0) {
        const stepsWithRecipeId = recipeData.steps.map(step => ({
          recipe_id: recipe.id,
          order_number: step.order_number,
          instruction: step.instruction,
          duration_minutes: step.duration_minutes || null,
        }));
        
        const { error: stepsError } = await supabase
          .from('steps')
          .insert(stepsWithRecipeId);
          
        if (stepsError) {
          // Rollback recipe and ingredients if steps fail
          await supabase.from('ingredients').delete().eq('recipe_id', recipe.id);
          await supabase.from('recipes').delete().eq('id', recipe.id);
          throw new Error(`Failed to create steps: ${stepsError.message}`);
        }
      }
      
      // Return the complete recipe with ingredients and steps
      const completeRecipe = await this.getRecipe(recipe.id);
      
      // Log activity after successful creation (non-blocking)
      if (completeRecipe && recipeData.space_id) {
        socialService.logActivity({
          spaceId: recipeData.space_id,
          actorId: recipeData.user_id,
          actionType: 'recipe_created',
          entityId: recipe.id,
          details: { 
            title: recipeData.title,
            actor_name: recipeData.user_name || 'User' // Use provided user name or fallback
          }
        }).catch(console.warn);
      }
      
      return completeRecipe;
      
    } catch (error) {
      console.error('Error in recipeService.createRecipe:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing recipe with ingredients and steps
   */
  async updateRecipe(recipeId: string, recipeData: RecipeUpdate): Promise<Recipe> {
    try {
      console.log('Updating recipe:', recipeId, 'with data:', recipeData);
      
      // Extract user_id from recipeData for activity logging, but don't include it in the update
      const { user_id: activityUserId, ...updateData } = recipeData;
      
      // Update basic recipe fields (excluding ingredients and steps for now)
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update({
          title: updateData.title,
          description: updateData.description,
          image_url: updateData.image_url,
          prep_time_minutes: updateData.prep_time_minutes,
          cook_time_minutes: updateData.cook_time_minutes,
          servings: updateData.servings,
          difficulty: updateData.difficulty,
          is_public: updateData.is_public,
          privacy_level: updateData.privacy_level,
          tags: updateData.tags,
          calories_per_serving: updateData.calories_per_serving,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipeId)
        .select()
        .single();
        
      if (recipeError) {
        throw new Error(`Failed to update recipe: ${recipeError.message}`);
      }
      
      // Handle ingredients update if provided
      if (recipeData.ingredients !== undefined) {
        // Delete existing ingredients
        await supabase.from('ingredients').delete().eq('recipe_id', recipeId);
        
        // Create new ingredients if any
        if (recipeData.ingredients.length > 0) {
          const ingredientsWithRecipeId = recipeData.ingredients.map(ingredient => ({
            recipe_id: recipeId,
            food_id: ingredient.food_id || null,
            unit_id: ingredient.unit_id || null,
            food_name: ingredient.food_name || null,
            unit_name: ingredient.unit_name || null,
            amount: ingredient.amount,
          }));
          
          const { error: ingredientsError } = await supabase
            .from('ingredients')
            .insert(ingredientsWithRecipeId);
            
          if (ingredientsError) {
            throw new Error(`Failed to update ingredients: ${ingredientsError.message}`);
          }
        }
      }
      
      // Handle steps update if provided
      if (recipeData.steps !== undefined) {
        // Delete existing steps
        await supabase.from('steps').delete().eq('recipe_id', recipeId);
        
        // Create new steps if any
        if (recipeData.steps.length > 0) {
          const stepsWithRecipeId = recipeData.steps.map(step => ({
            recipe_id: recipeId,
            order_number: step.order_number,
            instruction: step.instruction,
            duration_minutes: step.duration_minutes || null,
          }));
          
          const { error: stepsError } = await supabase
            .from('steps')
            .insert(stepsWithRecipeId);
            
          if (stepsError) {
            throw new Error(`Failed to update steps: ${stepsError.message}`);
          }
        }
      }
      
      // Return the updated complete recipe
      const updatedRecipe = await this.getRecipe(recipeId);
      
      // Log activity after successful update (non-blocking)
      if (updatedRecipe && updatedRecipe.space_id) {
        socialService.logActivity({
          spaceId: updatedRecipe.space_id,
          actorId: activityUserId || updatedRecipe.user_id,
          actionType: 'recipe_modified',
          entityId: recipeId,
          details: { 
            title: updateData.title || updatedRecipe.title,
            actor_name: (updateData as any).user_name || 'User' // Use provided user name or fallback
          }
        }).catch(console.warn);
      }
      
      return updatedRecipe;
      
    } catch (error) {
      console.error('Error in recipeService.updateRecipe:', error);
      throw error;
    }
  },
  
  /**
   * Delete a recipe and its associated ingredients and steps
   */
  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      console.log('Deleting recipe:', recipeId);
      
      // Delete ingredients first (foreign key dependency)
      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', recipeId);
        
      if (ingredientsError) {
        throw new Error(`Failed to delete ingredients: ${ingredientsError.message}`);
      }
      
      // Delete steps
      const { error: stepsError } = await supabase
        .from('steps')
        .delete()
        .eq('recipe_id', recipeId);
        
      if (stepsError) {
        throw new Error(`Failed to delete steps: ${stepsError.message}`);
      }
      
      // Delete the recipe itself
      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);
        
      if (recipeError) {
        throw new Error(`Failed to delete recipe: ${recipeError.message}`);
      }
      
      console.log('Recipe deleted successfully:', recipeId);
      
    } catch (error) {
      console.error('Error in recipeService.deleteRecipe:', error);
      throw error;
    }
  },

  /**
   * Get user's recipes with optional limit (optimized for collections page)
   * @param userId - The user ID to fetch recipes for
   * @param limit - Optional limit on number of recipes to return
   * @returns Array of user's recipes (basic fields only for performance)
   */
  async getUserRecipes(userId: string, limit?: number): Promise<Recipe[]> {
    try {
      let query = supabase
        .from('recipes')
        .select('id, title, image_url, description, prep_time_minutes, cook_time_minutes, servings, difficulty, created_at, calories_per_serving, user_id, space_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: recipesData, error: recipesError } = await query;

      if (recipesError) {
        throw new Error(`Failed to fetch user recipes: ${recipesError.message}`);
      }

      // Return basic recipe data for collections page (no ingredients/steps needed)
      // This eliminates the N+1 query problem that was causing 12-second load times
      return recipesData?.map((recipe: any): Recipe => ({
        ...recipe,
        difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
        privacy_level: recipe.privacy_level as 'public' | 'private' | 'space' | 'shared',
        ingredients: [], // Collections page doesn't need ingredients
        steps: [], // Collections page doesn't need steps
      })) || [];

    } catch (error) {
      console.error('Error in recipeService.getUserRecipes:', error);
      throw error;
    }
  },

  /**
   * Approve a recipe for public visibility
   * @param recipeId - The recipe ID to approve
   * @param approverId - The user ID of the approver
   * @returns Success status
   */
  async approveRecipePublic(recipeId: string, approverId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ 
          qa_status: 'approved_public',
          is_public: true,
          privacy_level: 'public',
          approved_by: approverId,
          approved_at: new Date().toISOString()
        })
        .eq('id', recipeId);

      if (error) {
        throw new Error(`Failed to approve recipe: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in recipeService.approveRecipePublic:', error);
      throw error;
    }
  },

  /**
   * Reject a recipe with feedback
   * @param recipeId - The recipe ID to reject
   * @param approverId - The user ID of the approver
   * @param feedback - The rejection feedback
   * @returns Success status
   */
  async rejectRecipePublic(recipeId: string, approverId: string, feedback: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ 
          qa_status: 'rejected_public',
          admin_notes: feedback.trim(),
          approved_by: approverId,
          approved_at: new Date().toISOString()
        })
        .eq('id', recipeId);

      if (error) {
        throw new Error(`Failed to reject recipe: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in recipeService.rejectRecipePublic:', error);
      throw error;
    }
  },

  /**
   * Get recipes pending approval
   * @returns Array of recipes pending approval
   */
  async getPendingApprovalRecipes(): Promise<any[]> {
    try {
      // Use explicit foreign key constraints for both joins
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          *,
          space:spaces!fk_recipes_space(id, name),
          user:user_profiles!fk_recipes_user_profile(user_id, display_name, avatar_url)
        `)
        .in('qa_status', ['pending', 'flag'])
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch pending recipes: ${error.message}`);
      }

      // Transform the data to match expected format
      return (recipes || []).map((recipe: any) => ({
        ...recipe,
        uploader_name: recipe.user?.display_name,
        uploader_avatar: recipe.user?.avatar_url,
        space_name: recipe.space?.name
      }));
    } catch (error) {
      console.error('Error in recipeService.getPendingApprovalRecipes:', error);
      throw error;
    }
  },

  /**
   * Get public recipes for browsing
   * @param limit - Optional limit
   * @returns Array of approved public recipes
   */
  async getPublicRecipes(limit?: number): Promise<any[]> {
    try {
      // Use explicit foreign key constraints for both joins
      let query = supabase
        .from('recipes')
        .select(`
          *,
          space:spaces!fk_recipes_space(id, name),
          user:user_profiles!fk_recipes_user_profile(user_id, display_name, avatar_url)
        `)
        .eq('qa_status', 'approved_public')
        .eq('is_public', true)
        .order('approved_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: recipes, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch public recipes: ${error.message}`);
      }

      // Transform the data to match expected format
      return (recipes || []).map((recipe: any) => ({
        ...recipe,
        author_name: recipe.user?.display_name,
        author_avatar: recipe.user?.avatar_url,
        space_name: recipe.space?.name
      }));
    } catch (error) {
      console.error('Error in recipeService.getPublicRecipes:', error);
      throw error;
    }
  },
};
