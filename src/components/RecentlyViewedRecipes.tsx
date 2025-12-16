import React, { useState, useEffect } from "react";
import RecipeCard from "./RecipeCard";
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const RecentlyViewedRecipes: React.FC = () => {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadRecentlyViewed = () => {
      if (!user) return;
      
      try {
        // Get recently viewed from localStorage
        const stored = localStorage.getItem(`recentlyViewed_${user.id}`);
        if (stored) {
          const viewedIds = JSON.parse(stored);
          
          // For now, show a placeholder message
          // In the future, we could fetch full recipe details
          setRecentlyViewed([]);
        }
      } catch (error) {
        console.error('Error loading recently viewed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecentlyViewed();
  }, [user]);
  
  // Don't show the section at all if user is not logged in
  if (!user) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }
  
  if (recentlyViewed.length === 0) {
    return (
      <div className="text-center py-16 bg-sage-50 rounded-lg border border-sage-200">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium text-slate-800 mb-3">
            No recently viewed recipes
          </h3>
          <p className="text-slate-600">
            Your recently viewed recipes will appear here
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {recentlyViewed.map((recipe, index) => (
        <RecipeCard
          key={`${recipe.id}-${index}`}
          recipe={recipe}
        />
      ))}
    </div>
  );
};

export default RecentlyViewedRecipes;
