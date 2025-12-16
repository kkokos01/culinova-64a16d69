import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "./RecipeCard";
import { Recipe, Activity } from "@/types";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { socialService } from "@/services/supabase/socialService";
import { recipeService } from "@/services/supabase/recipeService";
import { Loader2, Users, Folder, PlusCircle, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ActivityRecipeCardProps {
  recipe: Recipe;
  collectionName?: string;
  userName?: string;
}

const ActivityRecipeCard: React.FC<ActivityRecipeCardProps> = ({ 
  recipe, 
  collectionName, 
  userName 
}) => {
  return (
    <RecipeCard recipe={recipe} />
  );
};

const ActivityRecipes: React.FC = () => {
  const { user } = useAuth();
  const { spaces } = useSpace();
  
  console.log('🔍 ActivityRecipes: User:', user?.id, 'Spaces:', spaces.length, 'Space names:', spaces.map(s => s.name));
  
  // Fetch activities from all user spaces
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['spaceActivities', user?.id, spaces],
    queryFn: async () => {
      if (!user || spaces.length === 0) return [];
      
      console.log('🔍 ActivityRecipes: Fetching activities for', spaces.length, 'spaces');
      
      // Get activities from all spaces the user belongs to
      const allActivities: Activity[] = [];
      for (const space of spaces) {
        try {
          const spaceActivities = await socialService.getSpaceFeed(space.id, 20);
          console.log(`🔍 ActivityRecipes: Space ${space.name} has ${spaceActivities.length} activities`);
          allActivities.push(...spaceActivities);
        } catch (err) {
          console.error(`Error fetching activities for space ${space.id}:`, err);
        }
      }
      
      // Sort by created_at descending and limit to latest 8
      return allActivities
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 8);
    },
    enabled: !!user && spaces.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });
  
  // Fetch recipe details for activities
  const { data: recipes = [] } = useQuery({
    queryKey: ['activityRecipes', activities.map(a => a.entity_id)],
    queryFn: async () => {
      if (activities.length === 0) return [];
      
      const recipeDetails: (Recipe & { collectionName?: string; userName?: string })[] = [];
      
      for (const activity of activities) {
        if (activity.entity_type === 'recipe') {
          try {
            const recipe = await recipeService.getRecipe(activity.entity_id);
            if (recipe) {
              const collectionName = spaces.find(s => s.id === recipe.space_id)?.name;
              const userName = activity.details?.actor_name || activity.actor?.name || 'User';
              
              recipeDetails.push({
                ...recipe,
                collectionName,
                userName
              });
            }
          } catch (err) {
            console.error(`Error fetching recipe ${activity.entity_id}:`, err);
          }
        }
      }
      
      return recipeDetails;
    },
    enabled: activities.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  
  // Don't show the section at all if user is not logged in
  if (!user) {
    console.log('🔍 ActivityRecipes: No user, returning null');
    return null;
  }
  
  if (error) {
    console.error('Error fetching activity recipes:', error);
    console.log('🔍 ActivityRecipes: Error, returning null');
    return null;
  }
  
  if (isLoading) {
    console.log('🔍 ActivityRecipes: Loading, showing spinner');
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      </section>
    );
  }
  
  console.log('🔍 ActivityRecipes: Activities data:', activities.length, activities);
  
  if (activities.length === 0) {
    console.log('🔍 ActivityRecipes: No activities, showing placeholder');
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="text-center py-16 bg-sage-50 rounded-lg border border-sage-200">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              No recipes yet
            </h3>
            <p className="text-slate-600 mb-6">
              Join or start a Shared Collection to share recipes with friends and family
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-sage-400 hover:bg-sage-500 text-white">
                <Link to="/collections">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Collection
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-sage-200 hover:bg-sage-50">
                <Link to="/publiccollections">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Public Collections
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="container mx-auto px-4 py-8">
      {/* Recipe grid - no header or button since parent handles it */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recipes.map((recipe, index) => (
          <ActivityRecipeCard
            key={`${recipe.id}-${index}`}
            recipe={recipe}
            collectionName={recipe.collectionName}
            userName={recipe.userName}
          />
        ))}
      </div>
    </section>
  );
};

export default ActivityRecipes;
