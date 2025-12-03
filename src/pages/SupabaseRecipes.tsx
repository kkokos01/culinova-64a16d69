
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useSupabaseRecipes } from "@/hooks/useSupabaseRecipes";
import RecipeCard from "@/components/RecipeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const SupabaseRecipes = () => {
  const { recipes, loading, error } = useSupabaseRecipes();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-semibold text-slate-800 mb-4">
            Supabase Recipes
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            These recipes are loaded directly from the Supabase database. Click on any recipe to view its details.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-8">
            <h3 className="font-medium">Error</h3>
            <p>{error.message}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
              <h3 className="font-medium text-lg mb-2">Recipe UUIDs for Reference</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm font-mono">
                {recipes.map(recipe => (
                  <div key={`uuid-${recipe.id}`} className="bg-white p-2 rounded border border-blue-100">
                    <span className="font-medium mr-2">ID:</span> 
                    <Link to={`/recipes/${recipe.id}`} className="text-blue-600 hover:underline">
                      {recipe.id}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <SearchX className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">No recipes found</h3>
            <p className="text-slate-600 max-w-md mx-auto mb-8">
              There are no recipes in your Supabase database yet.
            </p>
            <Button asChild>
              <Link to="/collections">
                Go to Collections
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupabaseRecipes;
