
import React from "react";
import { Recipe } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Wand2 } from "lucide-react";

interface RecipeHeaderProps {
  recipe: Recipe;
  isModified?: boolean;
  onModifyWithAI: () => void;
  showModifyButton?: boolean;
  isTemporary?: boolean;
}

const RecipeHeader: React.FC<RecipeHeaderProps> = ({ 
  recipe, 
  isModified = false,
  onModifyWithAI,
  showModifyButton = true,
  isTemporary = false
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            {recipe.title}
            {isModified && (
              <Badge variant="outline" className="ml-2 px-2 py-1 bg-amber-50 text-amber-700 border-amber-300">
                Modified
              </Badge>
            )}
            {isTemporary && (
              <Badge variant="outline" className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 border-blue-300 flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Temporary
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 mt-1">{recipe.description}</p>
        </div>
        
        {showModifyButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onModifyWithAI}
            className="text-sage-600 border-sage-300 hover:bg-sage-50 flex items-center"
          >
            <Wand2 className="h-4 w-4 mr-1" />
            Modify
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 mt-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Prep:</span> {recipe.prep_time_minutes} min
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Cook:</span> {recipe.cook_time_minutes} min
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Servings:</span> {recipe.servings}
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-700">Difficulty:</span> {recipe.difficulty}
        </div>
      </div>
    </div>
  );
};

export default RecipeHeader;
