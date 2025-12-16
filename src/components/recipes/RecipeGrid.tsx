
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/RecipeCard";
import SkeletonCard from "@/components/ui/skeleton-card";
import { Recipe } from "@/types";

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  resetFilters: () => void;
}

const RecipeGrid = ({ recipes, isLoading, resetFilters }: RecipeGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-medium text-slate-800 mb-2">No recipes found</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Try adjusting your search or filter criteria to find what you're looking for.
        </p>
        <Button 
          onClick={resetFilters}
          variant="link"
          className="mt-4 text-sage-600"
        >
          Reset all filters
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};

export default RecipeGrid;
