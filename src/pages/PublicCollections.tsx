import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RecipeCard from "@/components/RecipeCard";
import { 
  Search, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Recipe } from "@/types";

const PublicCollections: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch public recipes
  useEffect(() => {
    const fetchPublicRecipes = async () => {
      try {
        setIsLoading(true);
        const recipes = await recipeService.getRecipes({ isPublic: true });
        setPublicRecipes(recipes);
        setFilteredRecipes(recipes);
      } catch (error) {
        console.error('Error fetching public recipes:', error);
        toast({
          title: "Error",
          description: "Failed to load public recipes",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPublicRecipes();
    }
  }, [user, toast]);

  // Filter recipes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(publicRecipes);
    } else {
      const filtered = publicRecipes.filter(recipe => 
        recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, publicRecipes]);

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Get Inspiration</h1>
            <p className="text-gray-600">
              Discover delicious recipes from the Culinova community
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Recipe Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sage-50 rounded-lg border border-sage-200">
            <Search className="h-12 w-12 text-sage-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-3">
              {searchQuery ? "No Recipes Found" : "No Public Recipes Yet"}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? "Try adjusting your search terms to find recipes."
                : "Be the first to share your recipes with the community!"
              }
            </p>
            <Button 
              onClick={() => navigate("/create")}
              className="bg-sage-400 hover:bg-sage-500 text-white"
            >
              Create a Recipe
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCollections;
