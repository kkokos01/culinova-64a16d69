
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SearchFilters from "@/components/recipes/SearchFilters";
import TagList from "@/components/recipes/TagList";
import RecipeGrid from "@/components/recipes/RecipeGrid";
import PageHeader from "@/components/recipes/PageHeader";
import { filterRecipes } from "@/utils/recipeUtils";
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRecipes } from "@/hooks/useSupabaseRecipes";

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  
  // Use the Supabase recipes hook instead of mock data
  const { recipes, loading: isLoading, error } = useSupabaseRecipes();
  
  // Show error toast if there's an error fetching recipes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching recipes",
        description: "There was a problem loading the recipes. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const filteredRecipes = filterRecipes(
    recipes,
    searchQuery,
    difficulty,
    timeFilter,
    selectedTags,
    sortOption
  );
  
  const handleTagToggle = (tag: string) => {
    // If tag is empty string, clear all tags
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <PageHeader 
          title="Explore Recipes"
          description="Find inspiration for your next culinary adventure with our collection of recipes from Supabase."
        />
        
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
        
        <TagList 
          selectedTags={selectedTags}
          handleTagToggle={handleTagToggle}
          clearAllTags={() => setSelectedTags([])}
        />
        
        <RecipeGrid 
          recipes={filteredRecipes}
          isLoading={isLoading}
          resetFilters={resetFilters}
        />
      </main>
    </div>
  );
};

export default Recipes;
