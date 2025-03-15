
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
    isModified,
    setIsModified,
    resetToOriginal,
    selectedIngredients
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
        />
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

export default RecipeDetail;
