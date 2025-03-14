
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "./RecipeCard";
import { Recipe } from "@/types";
import { Link } from "react-router-dom";

// Mock data - would be replaced with actual API calls to Supabase
const MOCK_RECIPES: Recipe[] = [
  {
    id: "1",
    user_id: "user1",
    title: "Creamy Garlic Herb Chicken",
    description: "A delicious creamy chicken dish with garlic and fresh herbs that's perfect for weeknight dinners.",
    image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 4,
    difficulty: "medium",
    is_public: true,
    tags: ["chicken", "dinner", "creamy"],
    created_at: "2023-08-15T14:00:00Z",
    updated_at: "2023-08-15T14:00:00Z"
  },
  {
    id: "2",
    user_id: "user2",
    title: "Mediterranean Quinoa Salad",
    description: "A refreshing quinoa salad with cucumber, tomatoes, feta cheese, and olives in a lemon dressing.",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    servings: 6,
    difficulty: "easy",
    is_public: true,
    tags: ["vegetarian", "salad", "healthy"],
    created_at: "2023-08-12T10:30:00Z",
    updated_at: "2023-08-12T10:30:00Z"
  },
  {
    id: "3",
    user_id: "user3",
    title: "Spicy Thai Basil Noodles",
    description: "Spicy and aromatic Thai noodles with basil, vegetables and your choice of protein.",
    image_url: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8",
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    servings: 2,
    difficulty: "medium",
    is_public: true,
    tags: ["asian", "spicy", "noodles"],
    created_at: "2023-08-10T18:15:00Z",
    updated_at: "2023-08-10T18:15:00Z"
  },
  {
    id: "4",
    user_id: "user1",
    title: "Classic Margherita Pizza",
    description: "A simple yet delicious pizza with fresh mozzarella, tomatoes, and basil on a thin crust.",
    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
    prep_time_minutes: 90,
    cook_time_minutes: 15,
    servings: 8,
    difficulty: "medium",
    is_public: true,
    tags: ["italian", "pizza", "vegetarian"],
    created_at: "2023-08-05T19:45:00Z",
    updated_at: "2023-08-05T19:45:00Z"
  }
];

const FeaturedRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call with setTimeout
    const timer = setTimeout(() => {
      setRecipes(MOCK_RECIPES);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h2 className="text-3xl font-display font-semibold text-slate-800 mb-2">
            Featured Recipes
          </h2>
          <p className="text-slate-600 max-w-2xl">
            Discover our curated collection of seasonal favorites and trending dishes from our community.
          </p>
        </div>
        <Button 
          asChild
          variant="outline" 
          className="mt-4 md:mt-0"
        >
          <Link to="/recipes" className="flex items-center">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="rounded-lg overflow-hidden">
              <div className="aspect-video bg-slate-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedRecipes;
