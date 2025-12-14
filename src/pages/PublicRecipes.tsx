import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Clock, Users, ChefHat } from "lucide-react";
import Navbar from "@/components/Navbar";

interface PublicRecipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: string;
  author_name?: string;
  author_avatar?: string;
  space_name?: string;
  approved_at: string;
  created_at: string;
}

const PublicCollections: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      
      let fetchedRecipes = await recipeService.getPublicRecipes(100);
      
      // Apply filters
      if (searchQuery) {
        fetchedRecipes = fetchedRecipes.filter(recipe =>
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (difficulty !== "all") {
        fetchedRecipes = fetchedRecipes.filter(recipe => recipe.difficulty === difficulty);
      }
      
      // Apply sorting
      switch (sortBy) {
        case "newest":
          fetchedRecipes.sort((a, b) => 
            new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime()
          );
          break;
        case "oldest":
          fetchedRecipes.sort((a, b) => 
            new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime()
          );
          break;
        case "rating":
          fetchedRecipes.sort((a, b) => b.average_rating - a.average_rating);
          break;
        case "popular":
          fetchedRecipes.sort((a, b) => b.rating_count - a.rating_count);
          break;
      }
      
      setRecipes(fetchedRecipes);
      
    } catch (error: any) {
      console.error("Error fetching public recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load public recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRecipes();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading public recipes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Public Collections</h1>
          <p className="text-gray-600">
            Discover and explore recipes approved by our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <div className="flex gap-4">
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recipe Grid */}
        {recipes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery || difficulty !== "all" 
                  ? "No recipes found matching your criteria" 
                  : "No public recipes available yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                    {recipe.image_url ? (
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <ChefHat className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{recipe.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {recipe.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Recipe Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {recipe.prep_time_minutes + recipe.cook_time_minutes}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {recipe.servings}
                        </span>
                      </div>
                      <Badge className={getDifficultyColor(recipe.difficulty)}>
                        {recipe.difficulty}
                      </Badge>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>by {recipe.author_name || "Anonymous"}</span>
                      {recipe.space_name && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {recipe.space_name}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicCollections;
