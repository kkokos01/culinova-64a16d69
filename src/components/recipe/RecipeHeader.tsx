
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useRecipe } from "@/context/recipe";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { Recipe } from "@/types";
import { Button } from "@/components/ui/button";
import { AddToCollectionButton } from "./AddToCollectionButton";
import { RecipeActions } from "./RecipeActions";
import { ShoppingCart, Flame, ChefHat, Copy } from "lucide-react";
import { recipeService } from "@/services/supabase/recipeService";
import { socialService } from "@/services/supabase/socialService";
import { useToast } from "@/hooks/use-toast";
import { FEATURES } from '@/config/features';

interface RecipeHeaderProps {
  title?: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  // Add new props to match what's being passed in Desktop and Mobile layouts
  recipe?: Recipe;
  isModified?: boolean;
  onModifyWithAI?: () => void;
  showModifyButton?: boolean;
  isTemporary?: boolean;
  onOpenShoppingList?: () => void;
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({
  title,
  description,
  prepTime,
  cookTime,
  servings,
  difficulty,
  recipe: propRecipe,
  isModified,
  onModifyWithAI,
  showModifyButton,
  isTemporary,
  onOpenShoppingList,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { recipe: contextRecipe } = useRecipe();
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  const [isForking, setIsForking] = useState(false);
  
  // Log for debugging
  useEffect(() => {
    if (contextRecipe) {
      console.log("RecipeHeader rendering with recipe:", contextRecipe.title);
    } else if (propRecipe) {
      console.log("RecipeHeader rendering with prop recipe:", propRecipe.title);
    }
  }, [contextRecipe, propRecipe]);
  
  // Use recipe from context if available, then prop recipe, then fallback to individual props
  const recipeToUse = contextRecipe || propRecipe;
  
  // Use recipe from context if available to ensure we're showing the latest version
  const displayTitle = recipeToUse?.title || title;
  const displayDescription = recipeToUse?.description || description;
  const displayPrepTime = recipeToUse?.prep_time_minutes || prepTime;
  const displayCookTime = recipeToUse?.cook_time_minutes || cookTime;
  const displayServings = recipeToUse?.servings || servings;
  const displayDifficulty = recipeToUse?.difficulty || difficulty;
  
  // Calculate total time
  const totalTime = (displayPrepTime || 0) + (displayCookTime || 0);
  
  // Check if user can fork this recipe
  const canFork = recipeToUse?.user_id !== user?.id && 
                  user?.id && 
                  currentSpace?.id;
  
  // Check if user can edit this recipe
  const canEdit = recipeToUse?.user_id === user?.id;
  
  // Handle forking a recipe
  const handleForkRecipe = async () => {
    if (!canFork || !recipeToUse?.id || !currentSpace?.id) {
      toast({
        title: "Error",
        description: "Please select a collection first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsForking(true);
      
      const forkedRecipe = await recipeService.forkRecipe(
        recipeToUse.id,
        user.id,
        currentSpace.id
      );

      toast({
        title: 'Recipe Forked!',
        description: `"${recipeToUse.title}" has been added to ${currentSpace.name}.`,
      });

      // Optionally navigate to the forked recipe
      // navigate(`/recipes/${forkedRecipe.id}`);
      
    } catch (error) {
      console.error('Failed to fork recipe:', error);
      toast({
        title: 'Fork Failed',
        description: error instanceof Error ? error.message : 'Could not save recipe to your space.',
        variant: 'destructive'
      });
    } finally {
      setIsForking(false);
    }
  };
  
  // Format time to display in hours and minutes if needed
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
  };
  
  return (
    <div className="mb-8">
      {/* Recipe Image */}
      {recipeToUse?.image_url ? (
        <div className="mb-6">
          <img
            src={recipeToUse.image_url}
            alt={`${displayTitle} - AI generated recipe image`}
            className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-lg"
          />
        </div>
      ) : null}
      
      <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3">
        {displayTitle}
      </h1>
      <p className="text-gray-600 mb-4">{displayDescription}</p>
      
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
        {displayPrepTime && (
          <div>
            <span className="font-medium">Prep:</span> {displayPrepTime} min
          </div>
        )}
        {displayCookTime && (
          <div>
            <span className="font-medium">Cook:</span> {displayCookTime} min
          </div>
        )}
        {totalTime > 0 && (
          <div>
            <span className="font-medium">Total:</span> {formatTime(totalTime)}
          </div>
        )}
        {displayServings && (
          <div>
            <span className="font-medium">Servings:</span> {displayServings}
          </div>
        )}
        {displayDifficulty && (
          <div>
            <span className="font-medium">Difficulty:</span> {displayDifficulty}
          </div>
        )}
        {recipeToUse?.calories_per_serving && (
          <div className="flex items-center">
            <Flame className="h-4 w-4 mr-1 text-orange-500" />
            <span className="font-medium">Calories:</span> {recipeToUse.calories_per_serving} per serving
          </div>
        )}
      </div>

      {/* Action Section */}
      <div className="mt-6 mb-6 flex gap-2 flex-wrap">
        {/* Start Cooking Button - appears when recipe has steps */}
        {recipeToUse?.steps && recipeToUse.steps.length > 0 && (
          <Button
            onClick={() => navigate(`/recipes/${recipeToUse.id}/cook`)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Start Cooking
          </Button>
        )}
        
        {/* Add to Collection Button */}
        {recipeToUse?.id && recipeToUse.id !== "generated" && (
          <AddToCollectionButton
            recipeId={recipeToUse.id}
            currentSpaceId={recipeToUse.space_id}
            variant="outline"
            size="default"
          />
        )}
        
        {/* Shopping List Button */}
        {onOpenShoppingList && recipeToUse?.ingredients && recipeToUse.ingredients.length > 0 && (
          <Button
            onClick={onOpenShoppingList}
            variant="outline"
            className="flex items-center gap-2"
            aria-label="Add recipe ingredients to shopping list"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Shopping List
          </Button>
        )}
        
        {/* Fork Button - for non-owners */}
        {canFork && (
          <Button
            onClick={handleForkRecipe}
            disabled={isForking}
            variant="outline"
            className="flex items-center gap-2"
            aria-label="Save a copy of this recipe to your space"
          >
            {isForking ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Forking...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Fork Recipe
              </>
            )}
          </Button>
        )}
        
        {/* Recipe Actions - Remove/Delete */}
        {recipeToUse?.id && recipeToUse.id !== "generated" && (
          <RecipeActions
            recipeId={recipeToUse.id}
            recipeOwnerId={recipeToUse.user_id}
            currentSpaceId={currentSpace?.id}
            isEditorOrAdmin={true} // TODO: Check actual user role in space
            onRecipeRemoved={() => {
              // Handle recipe removed from space
              toast({
                title: "Recipe removed",
                description: "Recipe has been removed from this collection"
              });
              // Invalidate relevant queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ['recipes'] });
              queryClient.invalidateQueries({ queryKey: ['space-recipes'] });
              queryClient.invalidateQueries({ queryKey: ['userRecipes'] });
            }}
            onRecipeDeleted={() => {
              // Handle recipe deleted
              toast({
                title: "Recipe deleted",
                description: "Recipe has been permanently deleted"
              });
              // Invalidate all recipe-related queries
              queryClient.invalidateQueries({ queryKey: ['recipes'] });
              queryClient.invalidateQueries({ queryKey: ['space-recipes'] });
              queryClient.invalidateQueries({ queryKey: ['userRecipes'] });
              queryClient.invalidateQueries({ queryKey: ['user-recipes'] });
              // Navigate away since recipe no longer exists
              navigate('/');
            }}
          />
        )}
      </div>

      {/* Removed RecipeVersionTabs from here - it's now only in VersionManagement */}
    </div>
  );
};

export default RecipeHeader;
