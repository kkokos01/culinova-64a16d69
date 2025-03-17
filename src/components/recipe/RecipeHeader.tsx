
import React, { useEffect } from "react";
import { useRecipe } from "@/context/recipe";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { Recipe } from "@/types";

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
}) => {
  const { recipe: contextRecipe } = useRecipe();
  
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
  
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
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
      </div>

      <RecipeVersionTabs />
    </div>
  );
};

export default RecipeHeader;
