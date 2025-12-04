import React, { useState, useEffect } from 'react';
import { Recipe } from '@/types';
import { socialService } from '@/services/supabase/socialService';
import { useAuth } from '@/context/AuthContext';
import { useSpace } from '@/context/SpaceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RecipeCard from '@/components/RecipeCard';
import { Loader2, Search, Filter, Copy, Heart, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'title', label: 'Alphabetical' },
  { value: 'prep_time_minutes', label: 'Quick to Make' }
];

export const Explore: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isForking, setIsForking] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  
  const recipesPerPage = 12;

  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      const offset = currentPage * recipesPerPage;
      
      let fetchedRecipes = await socialService.getPublicRecipes({
        limit: recipesPerPage,
        offset,
        search: searchTerm || undefined,
        tags: difficulty ? [difficulty] : undefined
      });

      // Apply client-side sorting for now (could be moved to server)
      if (sortBy === 'title') {
        fetchedRecipes.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'prep_time_minutes') {
        fetchedRecipes.sort((a, b) => (a.prep_time_minutes || 0) - (b.prep_time_minutes || 0));
      }

      setRecipes(fetchedRecipes);
      
      // For simplicity, we'll assume there are more recipes if we got a full page
      // In production, you'd want a separate count query
      setTotalCount(fetchedRecipes.length === recipesPerPage ? (currentPage + 1) * recipesPerPage + 1 : offset + fetchedRecipes.length);
      
    } catch (error) {
      console.error('Failed to fetch public recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipes. Please try again.',
        variant: 'destructive'
      });
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when filters change
  }, [searchTerm, difficulty, sortBy]);

  useEffect(() => {
    fetchRecipes();
  }, [currentPage, searchTerm, difficulty, sortBy]);

  const handleForkRecipe = async (recipe: Recipe) => {
    if (!user?.id || !currentSpace?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in and select a space to fork recipes.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsForking(recipe.id);
      
      const forkedRecipe = await socialService.forkRecipe(
        recipe.id,
        currentSpace.id,
        user.id
      );

      toast({
        title: 'Recipe Forked!',
        description: `"${recipe.title}" has been added to your space.`
      });

      // Optionally navigate to the forked recipe
      // window.location.href = `/recipes/${forkedRecipe.id}`;
      
    } catch (error) {
      console.error('Failed to fork recipe:', error);
      toast({
        title: 'Fork Failed',
        description: 'Could not save recipe to your space. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsForking(null);
    }
  };

  const totalPages = Math.ceil(totalCount / recipesPerPage);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Public Recipes</h1>
        <p className="text-muted-foreground">
          Discover and save recipes shared by the Culinova community
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Difficulty Filter */}
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `Showing ${recipes.length} recipes`}
        </p>
        {user && currentSpace && (
          <Badge variant="outline" className="text-xs">
            Forking to: {currentSpace.name}
          </Badge>
        )}
      </div>

      {/* Loading State */}
      {isLoading && currentPage === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters to find more recipes.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setDifficulty('');
              setSortBy('created_at');
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Recipe Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="relative group">
                <RecipeCard recipe={recipe} />
                
                {/* Fork Button Overlay */}
                {user && currentSpace && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      onClick={() => handleForkRecipe(recipe)}
                      disabled={isForking === recipe.id}
                      className="bg-background/90 backdrop-blur-sm hover:bg-background"
                    >
                      {isForking === recipe.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0 || isLoading}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isLoading}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1 || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
