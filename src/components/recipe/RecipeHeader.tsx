
import React from "react";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types";
import { Wand2 } from "lucide-react";

interface RecipeHeaderProps {
  recipe: Recipe;
  isModified: boolean;
  onModifyWithAI: () => void;
  showModifyButton?: boolean; // Controls button visibility
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({ 
  recipe, 
  isModified, 
  onModifyWithAI,
  showModifyButton = true // Default to showing the button
}) => {
  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Recipe details - left side */}
        <div className="flex-grow">
          <div className="mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
              {recipe.title}
              {isModified && <span className="ml-2 text-sm font-normal text-sage-600">(Modified)</span>}
            </h1>
            <p className="text-gray-600 mb-2 text-base">{recipe.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-1">
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-sm">Prep:</span>
              <span className="ml-1 text-sm">{recipe.prep_time_minutes} min</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-sm">Cook:</span>
              <span className="ml-1 text-sm">{recipe.cook_time_minutes} min</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-sm">Servings:</span>
              <span className="ml-1 text-sm">{recipe.servings}</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-sm">Difficulty:</span>
              <span className="ml-1 text-sm capitalize">{recipe.difficulty}</span>
            </div>
          </div>
        </div>
        
        {/* Image - right side with overlay button */}
        {recipe.image_url && (
          <div className="md:w-1/3 lg:w-1/4 rounded-lg overflow-hidden shadow-md h-48 md:h-48 w-full aspect-square relative">
            <img 
              src={recipe.image_url} 
              alt={recipe.title} 
              className="w-full h-full object-cover"
            />
            {showModifyButton && (
              <div className="absolute bottom-2 right-2">
                <Button 
                  onClick={onModifyWithAI} 
                  className="bg-sage-700 hover:bg-sage-800 shadow-md text-white"
                  size="sm"
                >
                  <Wand2 className="mr-1 h-4 w-4" />
                  Modify with AI
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeHeader;
