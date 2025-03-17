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
import { useSeedRecipes } from "@/utils/seedRecipes";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [findingTikka, setFindingTikka] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { recipes, loading: isLoading, error, refreshRecipes } = useSupabaseRecipes();
  const { seedRecipes } = useSeedRecipes();
  
  useEffect(() => {
    const findDefaultRecipe = async () => {
      if (!findingTikka && recipes.length === 0 && !isLoading && user) {
        setFindingTikka(true);
        
        try {
          console.log("Looking for a default recipe...");
          
          const { data, error } = await supabase
            .from('recipes')
            .select('id, title')
            .ilike('title', '%tikka masala%')
            .limit(1);
            
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log("Found recipe:", data[0]);
            
            toast({
              title: "Recipe Found",
              description: `Found "${data[0].title}". Navigating to recipe.`
            });
            
            searchParams.set('findRecipe', 'tikka masala');
            setSearchParams(searchParams);
          } else {
            console.log("No default recipe found");
            
            toast({
              title: "No Recipes Found",
              description: "Try adding sample recipes by clicking the button above.",
              duration: 5000
            });
          }
        } catch (err) {
          console.error("Error finding default recipe:", err);
        } finally {
          setFindingTikka(false);
        }
      }
    };
    
    findDefaultRecipe();
  }, [recipes, isLoading, user, navigate, toast, findingTikka, searchParams, setSearchParams]);
  
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

  const handleSeedRecipes = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add sample recipes",
        variant: "destructive"
      });
      return;
    }

    if (!currentSpace) {
      toast({
        title: "Space Required",
        description: "Please select a space to add recipes to",
        variant: "destructive"
      });
      return;
    }

    console.log("Adding sample recipes...");
    const result = await seedRecipes();
    console.log("Seed result:", result);
    
    if (result) {
      console.log("Refreshing recipes after seeding...");
      refreshRecipes();
      
      const { data } = await supabase
        .from('recipes')
        .select('id')
        .ilike('title', '%tikka masala%')
        .limit(1);
        
      if (data && data.length > 0) {
        toast({
          title: "Tikka Masala Recipe Added",
          description: "Successfully added Tikka Masala recipe!",
          duration: 5000
        });
        
        searchParams.set('findRecipe', 'tikka masala');
        setSearchParams(searchParams);
      }
    }
  };

  console.log("Auth state:", { user: !!user, spaceId: currentSpace?.id });
  console.log("Recipe count:", recipes.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <PageHeader 
            title="Explore Recipes"
            description="Find inspiration for your next culinary adventure with our collection of recipes from Supabase."
          />
          
          {user && (
            <Button 
              onClick={handleSeedRecipes}
              className="bg-sage-500 hover:bg-sage-600"
            >
              Add Sample Recipes
            </Button>
          )}
        </div>
        
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
