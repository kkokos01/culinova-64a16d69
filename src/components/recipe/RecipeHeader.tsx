
import React from "react";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types";
import { Wand2 } from "lucide-react";

interface RecipeHeaderProps {
  recipe: Recipe;
  isModified: boolean;
  onModifyWithAI: () => void;
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({ recipe, isModified, onModifyWithAI }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Recipe details - left side */}
        <div className="flex flex-col flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {recipe.title}
                {isModified && <span className="ml-2 text-sm font-normal text-primary">(Modified)</span>}
              </h1>
              <p className="text-gray-600 mb-3 text-sm">{recipe.description}</p>
            </div>
            <Button 
              onClick={onModifyWithAI} 
              className="bg-primary hover:bg-primary/90 whitespace-nowrap self-start"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Modify with AI
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-xs">Prep:</span>
              <span className="ml-1 text-xs">{recipe.prep_time_minutes} min</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-xs">Cook:</span>
              <span className="ml-1 text-xs">{recipe.cook_time_minutes} min</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-xs">Servings:</span>
              <span className="ml-1 text-xs">{recipe.servings}</span>
            </div>
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md">
              <span className="font-medium text-xs">Difficulty:</span>
              <span className="ml-1 text-xs capitalize">{recipe.difficulty}</span>
            </div>
          </div>
        </div>
        
        {/* Image - right side, smaller */}
        {recipe.image_url && (
          <div className="lg:w-1/3 rounded-lg overflow-hidden shadow-md h-fit">
            <img 
              src={recipe.image_url} 
              alt={recipe.title} 
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeHeader;
