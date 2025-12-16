import React, { useState, useEffect } from "react";
import RecipeCard from "./RecipeCard";
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { recipeService } from "@/services/supabase/recipeService";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const LatestActivityRecipes: React.FC = () => {
  const { user } = useAuth();
  const { spaces } = useSpace();
  
  // Fetch latest recipes from all user spaces
  const { data: recipes = [], isLoading, error } = useQuery({
    queryKey: ['latestRecipes', user?.id, spaces],
    queryFn: async () => {
      if (!user || spaces.length === 0) return [];
      
      const allRecipes: Recipe[] = [];
      
      // Get recipes from all spaces the user belongs to
      for (const space of spaces) {
        try {
          const spaceRecipes = await recipeService.getRecipes({ spaceId: space.id });
          allRecipes.push(...spaceRecipes);
        } catch (err) {
          console.error(`Error fetching recipes for space ${space.id}:`, err);
        }
      }
      
      // Sort by updated_at descending and limit to latest 8
      return allRecipes
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
        .slice(0, 8);
    },
    enabled: !!user && spaces.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });
  
  // Don't show the section at all if user is not logged in
  if (!user) {
    return null;
  }
  
  if (error) {
    console.error('Error fetching latest recipes:', error);
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }
  
  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 bg-sage-50 rounded-lg border border-sage-200">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium text-slate-800 mb-3">
            No recipes yet
          </h3>
          <p className="text-slate-600 mb-6">
            Start building your collection by creating or importing recipes
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {recipes.map((recipe, index) => (
        <RecipeCard
          key={`${recipe.id}-${index}`}
          recipe={recipe}
        />
      ))}
    </div>
  );
};

export default LatestActivityRecipes;
