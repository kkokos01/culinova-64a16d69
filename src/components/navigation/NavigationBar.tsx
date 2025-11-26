import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bookmark, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { recipeService } from "@/services/supabase/recipeService";
import { Recipe } from "@/types";

interface NavigationBarProps {
  showBack?: boolean;
  title?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  showBack = true, 
  title 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch latest 5 saved recipes for dropdown
  useEffect(() => {
    if (user) {
      fetchLatestRecipes();
    }
  }, [user]);

  const fetchLatestRecipes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Assuming recipeService has a getUserRecipes method
      const recipes = await recipeService.getUserRecipes(user.id, 5);
      setSavedRecipes(recipes || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      // Don't show toast for this background error
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRecipeClick = (recipeId: string) => {
    navigate(`/recipes/${recipeId}`);
  };

  const handleCollectionsClick = () => {
    navigate('/collections');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Collections Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                disabled={isLoading}
              >
                <Bookmark className="h-4 w-4" />
                <span>Collections</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              {savedRecipes.length > 0 ? (
                <>
                  <div className="px-2 py-1.5 text-sm text-gray-500 font-medium">
                    Latest Recipes
                  </div>
                  {savedRecipes.map((recipe) => (
                    <DropdownMenuItem
                      key={recipe.id}
                      onClick={() => handleRecipeClick(recipe.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{recipe.title}</span>
                        <span className="text-xs text-gray-500">
                          {recipe.prep_time_minutes + recipe.cook_time_minutes} min • 
                          {recipe.servings} servings
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              ) : (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  No saved recipes yet
                </div>
              )}
              
              <DropdownMenuItem
                onClick={handleCollectionsClick}
                className="cursor-pointer text-blue-600"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Other saved recipes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
