
import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RecipeCard from "@/components/RecipeCard";
import Navbar from "@/components/Navbar";
import { Recipe } from "@/types";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  },
  {
    id: "5",
    user_id: "user2",
    title: "Chocolate Chip Cookies",
    description: "Soft and chewy chocolate chip cookies with a perfect balance of sweet and salty.",
    image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e",
    prep_time_minutes: 20,
    cook_time_minutes: 10,
    servings: 24,
    difficulty: "easy",
    is_public: true,
    tags: ["dessert", "baking", "cookies"],
    created_at: "2023-08-03T11:20:00Z",
    updated_at: "2023-08-03T11:20:00Z"
  },
  {
    id: "6",
    user_id: "user3",
    title: "Beef Bourguignon",
    description: "Classic French beef stew with red wine, bacon, and vegetables, slow-cooked to perfection.",
    image_url: "https://images.unsplash.com/photo-1534939561126-855b8675edd7",
    prep_time_minutes: 30,
    cook_time_minutes: 180,
    servings: 6,
    difficulty: "hard",
    is_public: true,
    tags: ["french", "beef", "stew"],
    created_at: "2023-07-28T16:30:00Z",
    updated_at: "2023-07-28T16:30:00Z"
  },
  {
    id: "7",
    user_id: "user1",
    title: "Avocado Toast with Poached Egg",
    description: "Simple yet satisfying breakfast with creamy avocado and perfectly poached eggs on sourdough toast.",
    image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8",
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 2,
    difficulty: "easy",
    is_public: true,
    tags: ["breakfast", "vegetarian", "quick"],
    created_at: "2023-07-25T09:15:00Z",
    updated_at: "2023-07-25T09:15:00Z"
  },
  {
    id: "8",
    user_id: "user2",
    title: "Sushi Rolls",
    description: "Homemade sushi rolls with fresh fish, crisp vegetables, and seasoned rice.",
    image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
    prep_time_minutes: 45,
    cook_time_minutes: 30,
    servings: 4,
    difficulty: "hard",
    is_public: true,
    tags: ["japanese", "seafood", "sushi"],
    created_at: "2023-07-20T17:40:00Z",
    updated_at: "2023-07-20T17:40:00Z"
  }
];

// Define all available tags across recipes
const ALL_TAGS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free", "healthy", 
  "quick", "dinner", "breakfast", "lunch", "dessert", "snack", 
  "italian", "asian", "mexican", "french", "american", "mediterranean",
  "chicken", "beef", "pork", "seafood", "pasta", "soup", "salad", 
  "baking", "spicy", "low-carb", "high-protein"
];

// Define difficulty options
const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

// Define time options
const TIME_OPTIONS = [
  { value: "all", label: "All Times" },
  { value: "under15", label: "Under 15 Minutes" },
  { value: "under30", label: "Under 30 Minutes" },
  { value: "under60", label: "Under 1 Hour" },
  { value: "over60", label: "Over 1 Hour" }
];

// Define sorting options
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "time_asc", label: "Shortest Time" },
  { value: "time_desc", label: "Longest Time" }
];

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  useEffect(() => {
    // Simulate API call with setTimeout
    const timer = setTimeout(() => {
      setRecipes(MOCK_RECIPES);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filter and sort recipes based on selected filters
  const filteredRecipes = recipes
    .filter(recipe => 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(recipe => {
      if (difficulty === "all") return true;
      return recipe.difficulty === difficulty;
    })
    .filter(recipe => {
      const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
      
      switch (timeFilter) {
        case "under15":
          return totalTime < 15;
        case "under30":
          return totalTime < 30;
        case "under60":
          return totalTime < 60;
        case "over60":
          return totalTime >= 60;
        default:
          return true;
      }
    })
    .filter(recipe => {
      if (selectedTags.length === 0) return true;
      return selectedTags.some(tag => recipe.tags?.includes(tag));
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        case "time_asc":
          return (a.prep_time_minutes + a.cook_time_minutes) - (b.prep_time_minutes + b.cook_time_minutes);
        case "time_desc":
          return (b.prep_time_minutes + b.cook_time_minutes) - (a.prep_time_minutes + a.cook_time_minutes);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-semibold text-slate-800 mb-4">
            Explore Recipes
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Find inspiration for your next culinary adventure with our collection of delicious recipes.
          </p>
        </div>
        
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          
          <div className="flex flex-wrap gap-3 md:gap-4">
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full md:w-[180px] bg-white">
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
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-white">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto bg-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Tags
                    {selectedTags.length > 0 && (
                      <span className="ml-2 bg-sage-100 text-sage-800 rounded-full px-2 py-0.5 text-xs">
                        {selectedTags.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-4" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm mb-3">Select Tags</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-60 overflow-y-auto pr-2">
                    {ALL_TAGS.map(tag => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tag-${tag}`} 
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <Label 
                          htmlFor={`tag-${tag}`} 
                          className="text-sm cursor-pointer"
                        >
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTags([])}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                    <Button 
                      size="sm"
                      className="text-xs bg-sage-400 hover:bg-sage-500"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full md:w-[180px] bg-white">
                <div className="flex items-center">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <span className="flex-1 text-left truncate">Sort</span>
                </div>
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
        </div>
        
        {/* Selected filters display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedTags.map(tag => (
              <div 
                key={tag} 
                className="bg-sage-100 text-sage-700 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-2 hover:text-sage-900"
                  aria-label={`Remove ${tag} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {selectedTags.length > 1 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-slate-500 hover:text-slate-700 text-sm underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden bg-white">
                <div className="aspect-video bg-slate-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">No recipes found</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setDifficulty("all");
                setTimeFilter("all");
                setSelectedTags([]);
                setSortOption("newest");
              }}
              variant="link"
              className="mt-4 text-sage-600"
            >
              Reset all filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Recipes;
