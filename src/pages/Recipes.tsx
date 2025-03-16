
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
import { useNavigate } from "react-router-dom";
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
  
  // Use the Supabase recipes hook instead of mock data
  const { recipes, loading: isLoading, error, refreshRecipes } = useSupabaseRecipes();
  
  // Get the seed recipes function
  const { seedRecipes } = useSeedRecipes();
  
  // Find Tikka Masala recipe if we have no recipes
  useEffect(() => {
    const findTikkaMasala = async () => {
      if (!findingTikka && recipes.length === 0 && !isLoading && user) {
        setFindingTikka(true);
        
        try {
          console.log("Looking for Tikka Masala recipe...");
          
          // Search for any recipe with 'tikka masala' in the title
          const { data, error } = await supabase
            .from('recipes')
            .select('id, title')
            .ilike('title', '%tikka masala%')
            .limit(1);
            
          if (error) {
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log("Found Tikka Masala recipe:", data[0]);
            
            toast({
              title: "Recipe Found",
              description: `Found "${data[0].title}". Navigating to recipe.`
            });
            
            // Navigate to the Tikka Masala recipe detail page
            navigate(`/recipes/${data[0].id}`);
          } else {
            console.log("No Tikka Masala recipe found");
            
            // If no Tikka Masala recipe found and we have a seed function, suggest adding sample recipes
            toast({
              title: "No Recipes Found",
              description: "Try adding sample recipes by clicking the button above.",
              duration: 5000
            });
          }
        } catch (err) {
          console.error("Error finding Tikka Masala:", err);
        } finally {
          setFindingTikka(false);
        }
      }
    };
    
    findTikkaMasala();
  }, [recipes, isLoading, user, navigate, toast, findingTikka]);
  
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
      // Refresh the recipes list to show the new recipes
      console.log("Refreshing recipes after seeding...");
      refreshRecipes();
      
      // Check if we have a Tikka Masala recipe now
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
        
        setTimeout(() => {
          navigate(`/recipes/${data[0].id}`);
        }, 1500);
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
