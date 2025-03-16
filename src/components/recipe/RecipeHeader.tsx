
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
    <div className="mb-4"> {/* Reduced mb-6 to mb-4 for more compact layout */}
      <div className="flex flex-col lg:flex-row gap-4"> {/* Reduced gap-5 to gap-4 */}
        {/* Recipe details - left side */}
        <div className="flex flex-col flex-grow">
          <div className="mb-2"> {/* Reduced mb-3 to mb-2 */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1"> {/* Reduced text size and spacing */}
              {recipe.title}
              {isModified && <span className="ml-2 text-sm font-normal text-sage-600">(Modified)</span>}
            </h1>
            <p className="text-gray-600 mb-2 text-sm">{recipe.description}</p> {/* Reduced mb-3 to mb-2 and text size */}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-1"> {/* Reduced gap-3 to gap-2 and mb-2 to mb-1 */}
            <div className="flex items-center bg-secondary/50 px-3 py-1 rounded-md"> {/* Reduced padding */}
              <span className="font-medium text-xs">Prep:</span> {/* Reduced text-sm to text-xs */}
              <span className="ml-1 text-xs">{recipe.prep_time_minutes} min</span> {/* Reduced ml-1.5 to ml-1 and text-sm to text-xs */}
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
        
        {/* Image - right side with overlay button */}
        {recipe.image_url && (
          <div className="lg:w-1/3 rounded-lg overflow-hidden shadow-md h-40 lg:h-32 relative"> {/* Reduced width and fixed height */}
            <img 
              src={recipe.image_url} 
              alt={recipe.title} 
              className="w-full h-full object-cover"
            />
            {showModifyButton && (
              <div className="absolute bottom-2 right-2"> {/* Reduced from bottom-4 right-4 */}
                <Button 
                  onClick={onModifyWithAI} 
                  className="bg-sage-700 hover:bg-sage-800 shadow-md text-white scale-90" {/* Added scale-90 to make button slightly smaller */}
                  size="sm" {/* Changed from default to sm */}
                >
                  <Wand2 className="mr-1 h-3 w-3" /> {/* Reduced icon size and margin */}
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
