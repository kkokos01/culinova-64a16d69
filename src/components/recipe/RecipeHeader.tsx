
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
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {recipe.title}
            {isModified && <span className="ml-2 text-sm font-normal text-primary">(Modified)</span>}
          </h1>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{recipe.description}</p>
        </div>
        <Button 
          onClick={onModifyWithAI} 
          className="bg-primary hover:bg-primary/90 whitespace-nowrap self-start"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Modify with AI
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-md">
          <span className="font-medium text-sm">Prep:</span>
          <span className="ml-2 text-sm">{recipe.prep_time_minutes} min</span>
        </div>
        <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-md">
          <span className="font-medium text-sm">Cook:</span>
          <span className="ml-2 text-sm">{recipe.cook_time_minutes} min</span>
        </div>
        <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-md">
          <span className="font-medium text-sm">Servings:</span>
          <span className="ml-2 text-sm">{recipe.servings}</span>
        </div>
        <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-md">
          <span className="font-medium text-sm">Difficulty:</span>
          <span className="ml-2 text-sm capitalize">{recipe.difficulty}</span>
        </div>
      </div>
      
      {recipe.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden shadow-md">
          <img 
            src={recipe.image_url} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default RecipeHeader;
