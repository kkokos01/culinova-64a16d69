import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/types";
import { recipeService } from "@/services/supabase/recipeService";
import Navbar from "@/components/Navbar";
import SearchFilters from "@/components/recipes/SearchFilters";
import TagList from "@/components/recipes/TagList";
import RecipeGrid from "@/components/recipes/RecipeGrid";
import PageHeader from "@/components/recipes/PageHeader";
import { filterRecipes } from "@/utils/recipeUtils";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Collections: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use React Query for caching and performance
  const { data: savedRecipes = [], isLoading, error } = useQuery({
    queryKey: ['userRecipes', user?.id],
    queryFn: () => user ? recipeService.getUserRecipes(user.id) : [],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
  
  // Search and filter state ( like Recipes page)
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      // Data is now handled by React Query
      console.log('🔍 Collections: Using cached data for user:', user.id);
    } else {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Error loading collections",
        description: "Failed to load your saved recipes. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleCreateNew = () => {
    navigate("/create");
  };

  const handleTagToggle = (tag: string) => {
    if (tag === '') {
      setSelectedTags([]);
      return;
    }
    
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setDifficulty("all");
    setTimeFilter("all");
    setSelectedTags([]);
    setSortOption("newest");
  };

  // Filter recipes using the same logic as Recipes page (6 separate arguments)
  const filteredRecipes = filterRecipes(
    savedRecipes, 
    searchQuery,
    difficulty,
    timeFilter,
    selectedTags,
    sortOption
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading your collections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Collections</h1>
              <p className="text-gray-600">
                {savedRecipes.length === 0 
                  ? "You haven't saved any recipes yet. Create your first recipe to get started!"
                  : `You have ${savedRecipes.length} saved recipe${savedRecipes.length === 1 ? '' : 's'}`
                }
              </p>
            </div>
            
            <Button onClick={handleCreateNew} className="bg-sage-600 hover:bg-sage-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Recipe
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        {savedRecipes.length > 0 && (
          <>
            <SearchFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              sortOption={sortOption}
              setSortOption={setSortOption}
              selectedTags={selectedTags}
              handleTagToggle={handleTagToggle}
            />
            
            {/* Tags */}
            <TagList 
              selectedTags={selectedTags}
              handleTagToggle={handleTagToggle}
              clearAllTags={() => setSelectedTags([])}
            />
          </>
        )}

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 && savedRecipes.length > 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No recipes match your current filters.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setDifficulty("all");
                setTimeFilter("all");
                setSortOption("newest");
                setSelectedTags([]);
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : savedRecipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-6">
              Start creating and saving recipes to build your personal collection
            </p>
            <Button onClick={handleCreateNew} variant="outline" size="lg">
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Your First Recipe
            </Button>
          </div>
        ) : (
          <RecipeGrid 
            recipes={filteredRecipes}
            isLoading={isLoading}
            resetFilters={resetFilters}
          />
        )}
      </div>
    </div>
  );
};

export default Collections;
