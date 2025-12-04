import { supabase } from '@/integrations/supabase/client';
import { Recipe, RecipeCreate, Space } from '@/types';
import { recipeService } from './recipeService';

export interface Activity {
  id: string;
  space_id: string;
  actor_id: string;
  action_type: 'recipe_created' | 'recipe_modified' | 'recipe_forked' | 'user_joined';
  entity_id: string;
  entity_type: 'recipe' | 'member';
  details: Record<string, any>;
  created_at: string;
  actor?: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  };
}

/**
 * Service for handling social features: activity feeds, discovery, and forking
 */
export const socialService = {
  /**
   * Log an activity event to the feed
   * Silent fail for MVP - doesn't throw errors to avoid breaking main flows
   */
  async logActivity(params: {
    spaceId: string;
    actorId: string;
    actionType: 'recipe_created' | 'recipe_modified' | 'recipe_forked' | 'user_joined';
    entityId: string;
    entityType?: 'recipe' | 'member';
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      // Use any type to bypass Supabase type checking until types are regenerated
      const { error } = await (supabase.from('activities' as any) as any)
        .insert({
          space_id: params.spaceId,
          actor_id: params.actorId,
          action_type: params.actionType,
          entity_id: params.entityId,
          entity_type: params.entityType || 'recipe',
          details: params.details || {}
        });
      
      if (error) {
        console.warn('Failed to log activity:', error);
        // Silent fail for MVP - don't throw to avoid breaking main flows
      }
    } catch (error) {
      console.warn('Error logging activity:', error);
      // Silent fail for MVP
    }
  },

  /**
   * Get activity feed for a specific space
   */
  async getSpaceFeed(spaceId: string, limit = 20): Promise<Activity[]> {
    try {
      // Use any type to bypass Supabase type checking until types are regenerated
      const { data, error } = await (supabase.from('activities' as any) as any)
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Use the details JSON field to get actor names that we store during activity logging
      return (data || []).map(activity => ({
        ...activity,
        actor: activity.actor_id ? {
          id: activity.actor_id,
          name: activity.details?.actor_name || 'User',
          email: '',
          avatar_url: undefined
        } : null
      })) as Activity[];
    } catch (error) {
      console.error('Error fetching space feed:', error);
      throw error;
    }
  },

  /**
   * Get public spaces for browsing
   */
  async getPublicSpaces(): Promise<Space[]> {
    try {
      const { data, error } = await (supabase.from('spaces' as any) as any)
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as Space[];
    } catch (error) {
      console.error('Error fetching public spaces:', error);
      throw error;
    }
  },

  /**
   * Get public recipes for discovery
   */
  async getPublicRecipes(options: {
    limit?: number;
    offset?: number;
    search?: string;
    tags?: string[];
  } = {}): Promise<Recipe[]> {
    try {
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('privacy_level', 'public');
      
      if (options.search) {
        query = query.ilike('title', `%${options.search}%`);
      }
      
      if (options.tags?.length) {
        query = query.contains('tags', options.tags);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1);
      
      if (error) throw error;
      
      // Process and normalize the recipes with proper type handling
      return (data || []).map((recipe: any): Recipe => ({
        ...recipe,
        difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
        privacy_level: recipe.privacy_level as 'public' | 'private' | 'space' | 'shared',
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        calories_per_serving: recipe.calories_per_serving || undefined,
        parent_recipe_id: recipe.parent_recipe_id || undefined,
        forked_count: recipe.forked_count || 0
      }));
    } catch (error) {
      console.error('Error fetching public recipes:', error);
      throw error;
    }
  },

  /**
   * Fork a public recipe into user's space
   */
  async forkRecipe(originalRecipeId: string, targetSpaceId: string, userId: string, userName?: string): Promise<Recipe> {
    try {
      // Verify user has write access to target space before proceeding
      const { data: membership, error: membershipError } = await supabase
        .from('user_spaces')
        .select('role')
        .eq('user_id', userId)
        .eq('space_id', targetSpaceId)
        .eq('is_active', true)
        .single();
      
      if (membershipError || !membership) {
        throw new Error('You do not have access to this space');
      }
      
      if (membership.role === 'viewer') {
        throw new Error('You do not have permission to add recipes to this space');
      }
      
      // Get original recipe with all details
      const original = await recipeService.getRecipe(originalRecipeId);
      if (!original) {
        throw new Error('Original recipe not found');
      }
      
      if (original.privacy_level !== 'public') {
        throw new Error('Only public recipes can be forked');
      }
      
      // Create forked recipe copy
      const forkedRecipeData: RecipeCreate = {
        title: original.title,
        description: original.description,
        image_url: original.image_url,
        prep_time_minutes: original.prep_time_minutes,
        cook_time_minutes: original.cook_time_minutes,
        servings: original.servings,
        difficulty: original.difficulty,
        is_public: false,
        privacy_level: 'private',
        space_id: targetSpaceId,
        user_id: userId,
        user_name: userName || 'User', // Use provided user name or fallback
        ingredients: original.ingredients.map(ing => ({
          food_id: ing.food_id,
          unit_id: ing.unit_id,
          food_name: ing.food_name,
          unit_name: ing.unit_name,
          amount: ing.amount
        })),
        steps: original.steps.map(step => ({
          order_number: step.order_number,
          instruction: step.instruction,
          duration_minutes: step.duration_minutes
        })),
        tags: original.tags
      };
      
      const forkedRecipe = await recipeService.createRecipe(forkedRecipeData);
      
      // Update the forked recipe with parent reference
      const { error: updateError } = await (supabase.from('recipes' as any) as any)
        .update({ parent_recipe_id: originalRecipeId })
        .eq('id', forkedRecipe.id);
      
      if (updateError) {
        console.warn('Failed to set parent recipe ID:', updateError);
      }
      
      // Log the fork activity
      await this.logActivity({
        spaceId: targetSpaceId,
        actorId: userId,
        actionType: 'recipe_forked',
        entityId: forkedRecipe.id,
        details: {
          title: original.title,
          original_author_id: original.user_id,
          original_author_name: original.user?.name || 'Unknown',
          original_recipe_id: originalRecipeId
        }
      });
      
      return forkedRecipe;
    } catch (error) {
      console.error('Error forking recipe:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time activity updates for a space
   */
  subscribeToSpaceActivity(spaceId: string, callback: (activity: Activity) => void) {
    return supabase
      .channel(`space-activity-${spaceId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activities', 
          filter: `space_id=eq.${spaceId}` 
        },
        (payload) => {
          callback(payload.new as Activity);
        }
      )
      .subscribe();
  }
};
