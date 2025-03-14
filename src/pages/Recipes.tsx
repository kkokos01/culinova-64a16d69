
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SearchFilters from "@/components/recipes/SearchFilters";
import TagList from "@/components/recipes/TagList";
import RecipeGrid from "@/components/recipes/RecipeGrid";
import PageHeader from "@/components/recipes/PageHeader";
import { MOCK_RECIPES } from "@/data/mockRecipes";
import { filterRecipes } from "@/utils/recipeUtils";
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  
  useEffect(() => {
    // For initial development, we'll use mock recipes
    // Later we'll replace this with a Supabase query
    const fetchRecipes = async () => {
      setIsLoading(true);
      
      try {
        if (user && currentSpace) {
          // If we have a user and current space, fetch recipes from that space
          console.log(`Fetching recipes for space: ${currentSpace.id}`);
          // For now, still use mock data but log future query structure
          console.log(`Future query: SELECT * FROM recipes WHERE space_id = '${currentSpace.id}' OR is_public = true`);
        }
        
        // For now, just use mock data
        const timer = setTimeout(() => {
          // Add privacy_level to mock recipes for UI testing
          const enhancedMockRecipes = MOCK_RECIPES.map(recipe => ({
            ...recipe,
            privacy_level: recipe.is_public ? 'public' : 'space'
          }));
          
          setRecipes(enhancedMockRecipes);
          setIsLoading(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error fetching recipes:", error);
        toast({
          title: "Error fetching recipes",
          description: "There was a problem loading the recipes. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    fetchRecipes();
  }, [toast, user, currentSpace]);
  
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
          description="Find inspiration for your next culinary adventure with our collection of delicious recipes."
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
