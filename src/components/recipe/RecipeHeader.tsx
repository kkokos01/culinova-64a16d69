
import React from "react";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types";
import { Wand2 } from "lucide-react";

interface RecipeHeaderProps {
  recipe: Recipe;
  onModifyWithAI: () => void;
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({ recipe, onModifyWithAI }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
          <p className="text-gray-600 mb-4">{recipe.description}</p>
        </div>
        <Button 
          onClick={onModifyWithAI} 
          className="bg-primary hover:bg-primary/90"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          Modify with AI
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center">
          <span className="font-medium">Prep:</span>
          <span className="ml-2">{recipe.prep_time_minutes} min</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium">Cook:</span>
          <span className="ml-2">{recipe.cook_time_minutes} min</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium">Servings:</span>
          <span className="ml-2">{recipe.servings}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium">Difficulty:</span>
          <span className="ml-2 capitalize">{recipe.difficulty}</span>
        </div>
      </div>
      
      {recipe.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden">
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
