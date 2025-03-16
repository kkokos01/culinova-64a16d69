import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Ingredient } from "@/types";
import Navbar from "@/components/Navbar";
import { RecipeProvider, useRecipe } from "@/context/RecipeContext";
import { useMockRecipe } from "@/hooks/useMockRecipe";
import RecipeDetailSkeleton from "@/components/recipe/RecipeDetailSkeleton";
import MobileLayout from "@/components/recipe/MobileLayout";
import DesktopLayout from "@/components/recipe/DesktopLayout";

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
    selectIngredientForModification,
    isModified,
    setIsModified,
    resetToOriginal,
    selectedIngredients,
    addRecipeVersion,
    recipeVersions,
    hasInitializedVersions,
    setHasInitializedVersions
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
  
  // Initialize versions ONLY ONCE when recipe data is first loaded
  useEffect(() => {
    if (recipeData && !hasInitializedVersions) {
      // Only add Original version if we have no versions
      if (recipeVersions.length === 0) {
        addRecipeVersion("Original", recipeData);
      }
      // Mark that we've initialized versions to prevent re-initialization
      setHasInitializedVersions(true);
    }
  }, [recipeData, recipeVersions.length, hasInitializedVersions, addRecipeVersion, setHasInitializedVersions]);
  
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
    const ingredientActions = Array.from(selectedIngredients.entries())
      .map(([_, { ingredient, action }]) => `${action} ${ingredient.food?.name}`)
      .join(", ");
    
    const modificationMessage = ingredientActions 
      ? `Starting ${modificationType} modification with changes: ${ingredientActions}`
      : `Starting ${modificationType} modification...`;
    
    toast({
      title: "AI Modification Started",
      description: modificationMessage,
    });
    
    // Toggle modified status on (we would normally wait for the API response)
    setTimeout(() => {
      setIsModified(true);
      if (isMobile) {
        setLeftPanelOpen(false);
      }
    }, 1500);
  };
  
  const handleAcceptChanges = () => {
    toast({
      title: "Changes Accepted",
      description: "The recipe version has been saved.",
    });
    setIsModified(false);
  };

  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    // Using the context function to update selected ingredients
    selectIngredientForModification(ingredient, action);
  };

  if (isLoading) return <RecipeDetailSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 md:pt-24"> {/* Added padding to account for fixed navbar */}
        {isMobile ? (
          <MobileLayout 
            recipe={recipeData}
            selectedIngredient={selectedIngredient}
            isModified={isModified}
            resetToOriginal={resetToOriginal}
            leftPanelOpen={leftPanelOpen}
            rightPanelOpen={rightPanelOpen}
            setLeftPanelOpen={setLeftPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            handleModifyWithAI={handleModifyWithAI}
            handleStartModification={handleStartModification}
            handleAcceptChanges={handleAcceptChanges}
            setSelectedIngredient={setSelectedIngredient}
            onSelectIngredient={handleSelectIngredient}
          />
        ) : (
          <DesktopLayout 
            recipe={recipeData}
            selectedIngredient={selectedIngredient}
            isModified={isModified}
            resetToOriginal={resetToOriginal}
            handleModifyWithAI={handleModifyWithAI}
            handleStartModification={handleStartModification}
            handleAcceptChanges={handleAcceptChanges}
            setSelectedIngredient={setSelectedIngredient}
            onSelectIngredient={handleSelectIngredient}
          />
        )}
      </div>
    </div>
  );
};

// Main exported component wrapped with the RecipeProvider
const RecipeDetail = () => (
  <RecipeProvider>
    <RecipeDetailContainer />
  </RecipeProvider>
);

export default RecipeDetail;
