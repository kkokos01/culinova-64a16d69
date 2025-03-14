
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "./RecipeCard";
import { Recipe } from "@/types";
import { Link } from "react-router-dom";
import { MOCK_RECIPES } from "@/data/mockRecipes";

const FeaturedRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call with setTimeout
    const timer = setTimeout(() => {
      // Use the first 4 recipes from our mock data
      setRecipes(MOCK_RECIPES.slice(0, 4));
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h2 className="text-3xl font-display font-semibold text-slate-800 mb-2">
            Featured Recipes
          </h2>
          <p className="text-slate-600 max-w-2xl">
            Discover our curated collection of seasonal favorites and trending dishes from our community.
          </p>
        </div>
        <Button 
          asChild
          variant="outline" 
          className="mt-4 md:mt-0"
        >
          <Link to="/recipes" className="flex items-center">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="rounded-lg overflow-hidden">
              <div className="aspect-video bg-slate-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedRecipes;
