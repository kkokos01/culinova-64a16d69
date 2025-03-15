
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { Ingredient } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-mobile";
import { RecipeProvider, useRecipe } from "@/context/RecipeContext";

// Import our new hook for mock data
import { useMockRecipe } from "@/hooks/useMockRecipe";

// Import our components
import RecipeHeader from "@/components/recipe/RecipeHeader";
import RecipeContent from "@/components/recipe/RecipeContent";
import AIModificationPanel from "@/components/recipe/AIModificationPanel";
import ComparisonPanel from "@/components/recipe/ComparisonPanel";

// Main container component
const RecipeDetailContainer = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
  // Use the Recipe Context
  const { 
    setRecipe, 
    setOriginalRecipe, 
    selectedIngredient, 
    setSelectedIngredient,
    isModified,
    setIsModified,
    resetToOriginal
  } = useRecipe();
  
  // Use our mock recipe hook instead of react-query
  const { recipe: recipeData, loading: isLoading, error } = useMockRecipe(id || "");
  
  // Set recipe in context when data is loaded
  useEffect(() => {
    if (recipeData) {
      setRecipe(recipeData);
      setOriginalRecipe(recipeData);
    }
  }, [recipeData, setRecipe, setOriginalRecipe]);
  
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
  
  const handleModifyWithAI = () => {
    // Open the AI modification panel
    if (isMobile) {
      setLeftPanelOpen(true);
    }
    // For desktop, the panel is already visible in the left panel
  };
  
  const handleStartModification = (modificationType: string) => {
    // Here we would normally call an AI API
    // For now, we'll just simulate a modification
    toast({
      title: "AI Modification Started",
      description: `Starting ${modificationType} modification...`,
    });
    
    // Toggle modified status on (we would normally wait for the API response)
    setTimeout(() => {
      setIsModified(true);
      if (isMobile) {
        setLeftPanelOpen(false);
        setRightPanelOpen(true);
      }
    }, 1500);
  };
  
  const handleAcceptChanges = () => {
    toast({
      title: "Changes Accepted",
      description: "The recipe has been updated with AI modifications.",
    });
    setIsModified(false);
  };

  if (isLoading) return <RecipeDetailSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {isMobile ? (
        // Mobile layout with sliding sheets
        <div className="container mx-auto px-4 py-24">
          {/* Left Panel Sheet - AI Modification Panel */}
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
              <AIModificationPanel 
                recipe={recipeData}
                isOpen={leftPanelOpen}
                onClose={() => setLeftPanelOpen(false)}
                onStartModification={handleStartModification}
              />
            </SheetContent>
          </Sheet>
          
          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {recipeData && (
              <>
                <RecipeHeader 
                  recipe={recipeData}
                  onModifyWithAI={handleModifyWithAI}
                />
                <RecipeContent 
                  recipe={recipeData}
                  onSelectIngredient={setSelectedIngredient}
                />
              </>
            )}
          </div>
          
          {/* Right Panel Sheet - Comparison Panel */}
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
              <ComparisonPanel 
                recipe={recipeData}
                originalRecipe={recipeData}
                selectedIngredient={selectedIngredient}
                isModified={isModified}
                onResetToOriginal={resetToOriginal}
                onAcceptChanges={handleAcceptChanges}
              />
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        // Desktop layout with resizable panels
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-[calc(100vh-64px)] pt-24"
        >
          {/* Left Panel - AI Modification Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-gray-50">
            <div className="p-6 h-full overflow-y-auto">
              <AIModificationPanel 
                recipe={recipeData}
                isOpen={true}
                onClose={() => {}}
                onStartModification={handleStartModification}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main Content */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full overflow-y-auto bg-white p-6">
              {recipeData && (
                <>
                  <RecipeHeader 
                    recipe={recipeData}
                    onModifyWithAI={handleModifyWithAI}
                  />
                  <RecipeContent 
                    recipe={recipeData}
                    onSelectIngredient={setSelectedIngredient}
                  />
                </>
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Panel - Comparison Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-gray-50">
            <div className="p-6 h-full overflow-y-auto">
              <ComparisonPanel 
                recipe={recipeData}
                originalRecipe={recipeData}
                selectedIngredient={selectedIngredient}
                isModified={isModified}
                onResetToOriginal={resetToOriginal}
                onAcceptChanges={handleAcceptChanges}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

// Main exported component wrapped with the RecipeProvider
const RecipeDetail = () => (
  <RecipeProvider>
    <RecipeDetailContainer />
  </RecipeProvider>
);

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
