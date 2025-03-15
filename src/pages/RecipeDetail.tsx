
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Recipe, Ingredient, Step, Food, Unit } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  
  // Fetch recipe data
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      if (!id) throw new Error("Recipe ID is required");

      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (recipeError) throw recipeError;
      if (!recipeData) throw new Error("Recipe not found");

      // Fetch ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select(`
          id, 
          amount, 
          order_index,
          food_id, 
          unit_id,
          foods:food_id (id, name, description),
          units:unit_id (id, name, abbreviation)
        `)
        .eq('recipe_id', id)
        .order('order_index');

      if (ingredientsError) throw ingredientsError;

      // Fetch steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('recipe_id', id)
        .order('order_number');

      if (stepsError) throw stepsError;

      // Transform data to match our types
      const transformedIngredients: Ingredient[] = ingredientsData.map(ing => ({
        id: ing.id,
        food_id: ing.food_id,
        unit_id: ing.unit_id,
        amount: ing.amount,
        // Fix the type issue by correctly handling the food and unit objects
        food: ing.foods as unknown as Food, // Cast to Food instead of Food[]
        unit: ing.units as unknown as Unit  // Cast to Unit instead of Unit[]
      }));

      return {
        ...recipeData,
        ingredients: transformedIngredients,
        steps: stepsData
      } as Recipe;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading recipe",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  if (isLoading) return <RecipeDetailSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {isMobile ? (
        // Mobile layout with sliding sheets
        <div className="container mx-auto px-4 py-24">
          {/* Left Panel Sheet */}
          <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="fixed left-4 top-1/2 -translate-y-1/2 z-20 rounded-full"
                onClick={() => setLeftPanelOpen(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <LeftPanel recipe={recipe} selectedIngredient={selectedIngredient} />
            </SheetContent>
          </Sheet>
          
          {/* Main Content */}
          <MainContent recipe={recipe} onSelectIngredient={setSelectedIngredient} />
          
          {/* Right Panel Sheet */}
          <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="fixed right-4 top-1/2 -translate-y-1/2 z-20 rounded-full"
                onClick={() => setRightPanelOpen(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <RightPanel recipe={recipe} selectedIngredient={selectedIngredient} />
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        // Desktop layout with resizable panels
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-[calc(100vh-64px)] pt-24"
        >
          {/* Left Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-gray-50">
            <div className="p-6 h-full overflow-y-auto">
              <LeftPanel recipe={recipe} selectedIngredient={selectedIngredient} />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main Content */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full overflow-y-auto bg-white p-6">
              <MainContent recipe={recipe} onSelectIngredient={setSelectedIngredient} />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-gray-50">
            <div className="p-6 h-full overflow-y-auto">
              <RightPanel recipe={recipe} selectedIngredient={selectedIngredient} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

// MainContent component to display recipe details
const MainContent = ({ 
  recipe, 
  onSelectIngredient 
}: { 
  recipe: Recipe, 
  onSelectIngredient: (ingredient: Ingredient) => void 
}) => {
  if (!recipe) return null;
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Recipe Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        <p className="text-gray-600 mb-4">{recipe.description}</p>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <span className="font-medium">Prep:</span>
            <span className="ml-2">{recipe.prep_time_minutes} min</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Cook:</span>
            <span className="ml-2">{recipe.cook_time_minutes} min</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Servings:</span>
            <span className="ml-2">{recipe.servings}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Difficulty:</span>
            <span className="ml-2 capitalize">{recipe.difficulty}</span>
          </div>
        </div>
        
        {recipe.image_url && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <img 
              src={recipe.image_url} 
              alt={recipe.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
      
      {/* Ingredients */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients?.map((ingredient) => (
            <li 
              key={ingredient.id} 
              className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelectIngredient(ingredient)}
            >
              <span className="font-medium">{ingredient.amount} {ingredient.unit?.abbreviation}</span>
              <span className="ml-2">{ingredient.food?.name}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Steps */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
        <ol className="space-y-6">
          {recipe.steps?.map((step) => (
            <li key={step.id} className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {step.order_number}
                </div>
              </div>
              <div>
                <p className="text-gray-700">{step.instruction}</p>
                {step.duration_minutes && (
                  <p className="text-sm text-gray-500 mt-1">
                    Approximately {step.duration_minutes} minutes
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

// Left panel component (for AI controls, future implementation)
const LeftPanel = ({ 
  recipe, 
  selectedIngredient 
}: { 
  recipe: Recipe, 
  selectedIngredient: Ingredient | null 
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Recipe Assistant</h2>
      <p className="text-gray-600 mb-4">
        This panel will contain AI modification controls in future updates.
      </p>
      
      {/* Placeholder for AI controls */}
      <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 mb-4">
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <Info className="mx-auto h-8 w-8 mb-2" />
            <p>AI modification controls coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Right panel component (for comparison view, future implementation)
const RightPanel = ({ 
  recipe, 
  selectedIngredient 
}: { 
  recipe: Recipe, 
  selectedIngredient: Ingredient | null 
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Selected Ingredient</h2>
      
      {selectedIngredient ? (
        <div className="p-4 border border-gray-200 rounded-md bg-white">
          <h3 className="font-medium mb-2">{selectedIngredient.food?.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{selectedIngredient.food?.description || "No description available."}</p>
          <div className="flex items-center text-sm text-gray-700">
            <span className="font-medium">Amount:</span>
            <span className="ml-2">{selectedIngredient.amount} {selectedIngredient.unit?.abbreviation}</span>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Food ID: {selectedIngredient.food_id}</p>
            <Button variant="outline" size="sm" className="w-full">
              Send to LLM (Coming Soon)
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
          <p className="text-gray-500 text-center">
            Select an ingredient to view details
          </p>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Comparison View</h2>
        <p className="text-gray-600 mb-4">
          This section will show recipe modifications in future updates.
        </p>
        
        {/* Placeholder for comparison view */}
        <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Info className="mx-auto h-8 w-8 mb-2" />
              <p>Recipe comparison view coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton component
const RecipeDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-full mb-4" />
          
          <div className="flex flex-wrap gap-4 mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          <Skeleton className="aspect-video w-full rounded-lg mb-8" />
          
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-2 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={`ing-${i}`} className="h-6 w-full" />
            ))}
          </div>
          
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={`step-${i}`} className="flex">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
