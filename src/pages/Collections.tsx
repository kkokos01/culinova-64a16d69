import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/types";
import { recipeService } from "@/services/supabase/recipeService";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Search, 
  Users, 
  Settings, 
  Globe, 
  Lock,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpacesList from "@/components/auth/SpacesList";
import { SpaceCreator } from "@/components/auth/SpaceCreator";
import { useUserData } from "@/hooks/useUserData";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SearchFilters from "@/components/recipes/SearchFilters";
import TagList from "@/components/recipes/TagList";
import RecipeGrid from "@/components/recipes/RecipeGrid";
import { filterRecipes } from "@/utils/recipeUtils";

const Collections: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spaces, currentSpace, setCurrentSpace, createSpace } = useSpace();
  const { toast } = useToast();
  
  // Collapsible states
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isSpacesOpen, setIsSpacesOpen] = useState(true);
  
  // Recipe browsing state (from old Collections page)
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("all");

  // Use React Query for caching and performance
  const { data: savedRecipes = [], isLoading, error } = useQuery({
    queryKey: ['userRecipes', user?.id],
    queryFn: () => user ? recipeService.getUserRecipes(user.id) : [],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });

  const { 
    profileData, 
    setProfileData, 
    memberships,
    fetchSpaces,
  } = useUserData(user?.id);

  // Recipe browsing helper functions (from old Collections page)
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

  useEffect(() => {
    if (user) {
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

  // Filter recipes using the same logic as the old Collections page
  const filteredRecipes = filterRecipes(
    savedRecipes, 
    searchQuery,
    difficulty,
    timeFilter,
    selectedTags,
    sortOption
  );

  // Apply space filtering after other filters
  const spaceFilteredRecipes = selectedSpaceId === "all" 
    ? filteredRecipes 
    : filteredRecipes.filter(recipe => recipe.space_id === selectedSpaceId);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">My Collections</h1>
              <p className="text-gray-600">
                Manage your private collections and browse public collections from the community
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate("/publiccollections")}
                className="flex items-center"
              >
                <Globe className="h-4 w-4 mr-2" />
                Browse Public Collections
              </Button>
              <SpaceCreator refreshSpaces={fetchSpaces} />
            </div>
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-6">
          {/* Add or Change Collections Section - Hidden by default */}
          <Collapsible open={isManagementOpen} onOpenChange={setIsManagementOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 bg-sage-50 rounded-lg border border-sage-200 cursor-pointer hover:bg-sage-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-sage-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Add or Change Collections</h3>
                </div>
                <Button variant="ghost" size="sm">
                  {isManagementOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <SpacesList 
                userId={user.id}
                spaces={spaces}
                memberships={memberships}
                refreshSpaces={fetchSpaces}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* My Collections Section - Open by default */}
          <Collapsible open={isSpacesOpen} onOpenChange={setIsSpacesOpen}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 bg-sage-50 rounded-lg border border-sage-200 cursor-pointer hover:bg-sage-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-sage-600" />
                  <h3 className="text-lg font-semibold text-slate-800">My Collections</h3>
                </div>
                <Button variant="ghost" size="sm">
                  {isSpacesOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-6">
                {/* Collection Filter */}
                {isLoading ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-gray-400 animate-spin mr-3" />
                      <span className="text-gray-600">Loading collections...</span>
                    </div>
                  </div>
                ) : savedRecipes.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-4">
                      <label htmlFor="space-filter" className="text-sm font-semibold text-gray-600">
                        Filter by Collection:
                      </label>
                      <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                        <SelectTrigger className="w-full flex-1 bg-white border-gray-300 hover:border-gray-400 focus:border-gray-500">
                          <SelectValue placeholder="All Recipes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Recipes</SelectItem>
                          {spaces.map((space) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}

                {/* Recipe count */}
                <div className="mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="h-5 w-5 text-gray-400 animate-spin mr-3" />
                          Loading recipes...
                        </div>
                      ) : spaceFilteredRecipes.length === 0 ? (
                        "No Recipes"
                      ) : (
                        `${spaceFilteredRecipes.length} Recipe${spaceFilteredRecipes.length === 1 ? '' : 's'}`
                      )}
                    </h2>
                    <p className="text-gray-600">
                      {isLoading 
                        ? "Fetching your saved recipes..."
                        : selectedSpaceId === "all" 
                          ? "Showing all your saved recipes"
                          : `Showing recipes from ${spaces.find(s => s.id === selectedSpaceId)?.name || 'selected space'}`
                      }
                    </p>
                  </div>
                </div>

                {/* Search and Filters */}
                {isLoading ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-gray-400 animate-spin mr-3" />
                      <span className="text-gray-600">Loading search options...</span>
                    </div>
                  </div>
                ) : savedRecipes.length > 0 ? (
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
                    
                    {/* Recipe Grid */}
                    {spaceFilteredRecipes.length > 0 ? (
                      <RecipeGrid 
                        recipes={spaceFilteredRecipes}
                        isLoading={false}
                        resetFilters={resetFilters}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                          {selectedSpaceId === "all" 
                            ? "No recipes match your search criteria."
                            : "No recipes found in this collection."
                          }
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={resetFilters}
                          className="mt-4"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </>
                ) : null}

                {/* No recipes */}
                {savedRecipes.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-600 mb-6">
                      Start creating and saving recipes to build your personal collection
                    </p>
                    <Button onClick={handleCreateNew} variant="outline" size="lg">
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Create Your First Recipe
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default Collections;
