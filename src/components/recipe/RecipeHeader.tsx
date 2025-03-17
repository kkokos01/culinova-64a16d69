
import React, { useEffect } from "react";
import { useRecipe } from "@/context/recipe";
import RecipeVersionTabs from "./RecipeVersionTabs";

interface RecipeHeaderProps {
  title: string;
  description: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({
  title,
  description,
  prepTime,
  cookTime,
  servings,
  difficulty,
}) => {
  const { recipe } = useRecipe();
  
  // Log for debugging
  useEffect(() => {
    if (recipe) {
      console.log("RecipeHeader rendering with recipe:", recipe.title);
    }
  }, [recipe]);
  
  // Use recipe from context if available to ensure we're showing the latest version
  const displayTitle = recipe?.title || title;
  const displayDescription = recipe?.description || description;
  const displayPrepTime = recipe?.prep_time_minutes || prepTime;
  const displayCookTime = recipe?.cook_time_minutes || cookTime;
  const displayServings = recipe?.servings || servings;
  const displayDifficulty = recipe?.difficulty || difficulty;
  
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
