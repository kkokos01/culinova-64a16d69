
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "./RecipeCard";
import { Recipe } from "@/types";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { recipeService } from "@/services/supabase/recipeService";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const FeaturedRecipes = () => {
  const { user } = useAuth();
  
  // Use React Query for caching and performance
  const { data: userRecipes = [], isLoading, error } = useQuery({
    queryKey: ['userRecipes', user?.id],
    queryFn: () => user ? recipeService.getUserRecipes(user.id) : [],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
  
  // Sort by created_at descending and take latest 4
  const recipes = userRecipes
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 4);
  
  console.log('🔍 FeaturedRecipes: Using cached data, recipes:', recipes.length);
  
  // Don't show the section at all if user is not logged in
  if (!user) {
    return null;
  }
  
  if (error) {
    console.error('Error fetching latest recipes:', error);
    return null;
  }
  
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h2 className="text-3xl font-display font-semibold text-slate-800 mb-2">
            Latest Recipes
          </h2>
          <p className="text-slate-600 max-w-2xl">
            Your most recent recipe creations. Keep cooking and building your personal collection!
          </p>
        </div>
        <Button 
          asChild
          variant="outline" 
          className="mt-4 md:mt-0"
        >
          <Link to="/collections" className="flex items-center">
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
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="h-8 w-8 text-sage-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No recipes yet</h3>
            <p className="text-slate-600 mb-6">
              Start creating delicious recipes to see your latest creations here
            </p>
            <Button asChild className="bg-sage-600 hover:bg-sage-700">
              <Link to="/create">Create Your First Recipe</Link>
            </Button>
          </div>
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
