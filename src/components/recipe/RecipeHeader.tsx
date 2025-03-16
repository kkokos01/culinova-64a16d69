
import React from "react";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types";
import { Wand2 } from "lucide-react";

interface RecipeHeaderProps {
  recipe: Recipe;
  isModified: boolean;
  onModifyWithAI: () => void;
  showModifyButton?: boolean; // New prop to control button visibility
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({ 
  recipe, 
  isModified, 
  onModifyWithAI,
  showModifyButton = true // Default to showing the button
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Recipe details - left side */}
        <div className="flex flex-col flex-grow">
          <div className="mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {recipe.title}
              {isModified && <span className="ml-2 text-sm font-normal text-purple-600">(Modified)</span>}
            </h1>
            <p className="text-gray-600 mb-4 text-base">{recipe.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex items-center bg-secondary/50 px-4 py-1.5 rounded-md">
              <span className="font-medium text-sm">Prep:</span>
              <span className="ml-1.5 text-sm">{recipe.prep_time_minutes} min</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-4 py-1.5 rounded-md">
              <span className="font-medium text-sm">Cook:</span>
              <span className="ml-1.5 text-sm">{recipe.cook_time_minutes} min</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-4 py-1.5 rounded-md">
              <span className="font-medium text-sm">Servings:</span>
              <span className="ml-1.5 text-sm">{recipe.servings}</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-4 py-1.5 rounded-md">
              <span className="font-medium text-sm">Difficulty:</span>
              <span className="ml-1.5 text-sm capitalize">{recipe.difficulty}</span>
            </div>
          </div>
        </div>
        
        {/* Image - right side with overlay button */}
        {recipe.image_url && (
          <div className="lg:w-2/5 rounded-lg overflow-hidden shadow-md h-fit relative">
            <img 
              src={recipe.image_url} 
              alt={recipe.title} 
              className="w-full h-auto object-cover"
            />
            {showModifyButton && (
              <div className="absolute bottom-4 right-4">
                <Button 
                  onClick={onModifyWithAI} 
                  className="bg-purple-600/90 hover:bg-purple-700 shadow-md backdrop-blur-sm text-white"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
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
