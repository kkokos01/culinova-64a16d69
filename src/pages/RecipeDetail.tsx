
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Ingredient } from "@/types";
import Navbar from "@/components/Navbar";
import { RecipeProvider, useRecipe } from "@/context/recipe"; 
import { useMockRecipe } from "@/hooks/useMockRecipe";
import RecipeDetailSkeleton from "@/components/recipe/RecipeDetailSkeleton";
import MobileLayout from "@/components/recipe/MobileLayout";
import DesktopLayout from "@/components/recipe/DesktopLayout";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";

// Main container component
const RecipeDetailContainer = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
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
    setHasInitializedVersions,
    fetchVersionsFromDb
  } = useRecipe();
  
  // Use our mock recipe hook initially - we'll replace this with Supabase later
  const { recipe: recipeData, loading: isLoading, error } = useMockRecipe(id || "");
  
  // Set recipe in context when data is loaded
  useEffect(() => {
    if (recipeData) {
      console.log("Setting recipe in context:", recipeData);
      setRecipe(recipeData);
      setOriginalRecipe(recipeData);
    }
  }, [recipeData, setRecipe, setOriginalRecipe]);
  
  // Fetch versions from the database when recipe data is loaded
  useEffect(() => {
    const initializeVersions = async () => {
      if (recipeData && !hasInitializedVersions) {
        console.log("Initializing versions for recipe", recipeData.id);
        
        // Fetch versions from the database
        await fetchVersionsFromDb(recipeData.id);
        
        // If no versions exist yet, create the Original version
        if (recipeVersions.length === 0) {
          console.log("No versions found, creating Original version for recipe", recipeData.id);
          await addRecipeVersion("Original", recipeData);
        } else {
          console.log("Found existing versions:", recipeVersions.length);
        }
        
        // Mark that we've initialized versions to prevent re-initialization
        setHasInitializedVersions(true);
      }
    };
    
    initializeVersions();
  }, [recipeData, hasInitializedVersions, recipeVersions.length, addRecipeVersion, setHasInitializedVersions, fetchVersionsFromDb]);
  
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
    }, 1500);
  };
  
  const handleAcceptChanges = async () => {
    if (recipeData) {
      // In the real implementation, we would save the changes to the database
      // and create a new version with the modifications
      await addRecipeVersion("Modified", recipeData);
    }
    
    toast({
      title: "Changes Accepted",
      description: "The recipe version has been saved.",
    });
    setIsModified(false);
  };

  // Update the function signature to accept null as a possible action
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    // Using the context function to update selected ingredients
    selectIngredientForModification(ingredient, action);
  };

  if (isLoading) return <RecipeDetailSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-12 md:pt-16">
        {isMobile ? (
          <MobileLayout 
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
      <Toaster />
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
