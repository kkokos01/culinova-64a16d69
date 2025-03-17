
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipe } from "@/context/recipe";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRecipe } from "@/hooks/useSupabaseRecipe";
import { Ingredient, Recipe } from "@/types";

export const useRecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
    addTemporaryVersion,
    persistVersion,
    recipeVersions,
    hasInitializedVersions,
    setHasInitializedVersions,
    fetchVersionsFromDb,
    recipe: currentRecipe
  } = useRecipe();
  
  // Use our Supabase recipe hook
  const { recipe: recipeData, loading: isLoading, error } = useSupabaseRecipe(id || "");
  
  // State to track if we're currently modifying with AI
  const [isAiModifying, setIsAiModifying] = useState(false);
  
  // Redirect if recipe not found (after loading is complete)
  useEffect(() => {
    if (!isLoading && !recipeData && !error) {
      toast({
        title: "Recipe not found",
        description: "The recipe you're looking for couldn't be found. Redirecting to recipes page.",
        variant: "destructive"
      });
      
      // Redirect to recipes page after a short delay
      const timeout = setTimeout(() => {
        navigate('/recipes');
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [recipeData, isLoading, navigate, toast, error]);
  
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
        
        try {
          // Fetch versions from the database
          const versions = await fetchVersionsFromDb(recipeData.id);
          
          // If no versions exist yet, create the Original version
          if (versions.length === 0) {
            console.log("No versions found, creating Original version for recipe", recipeData.id);
            await addRecipeVersion("Original", recipeData);
          } else {
            console.log("Found existing versions:", versions.length);
          }
        } catch (error) {
          console.error("Error initializing versions:", error);
          toast({
            title: "Error loading recipe versions",
            description: error instanceof Error ? error.message : "Failed to load recipe versions",
            variant: "destructive"
          });
        } finally {
          // Mark that we've initialized versions to prevent re-initialization
          setHasInitializedVersions(true);
        }
      }
    };
    
    initializeVersions();
  }, [recipeData, hasInitializedVersions, addRecipeVersion, setHasInitializedVersions, fetchVersionsFromDb, toast]);

  // Function to handle ingredient selection
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    // Using the context function to update selected ingredients
    selectIngredientForModification(ingredient, action);
  };

  const handleModifyWithAI = () => {
    // Open the AI modification panel
    // For desktop, the panel is already visible in the left panel
  };
  
  const handleStartModification = async (modificationType: string) => {
    if (!currentRecipe) return;
    
    setIsAiModifying(true);
    
    try {
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
        // Create a temporary version with the modifications
        // In a real implementation, we would apply AI changes to the recipe
        const modifiedRecipe = {
          ...currentRecipe,
          // In a real implementation, we would make actual AI modifications here
          title: `${currentRecipe.title} (${modificationType})`
        };
        
        // Create a temporary version (not saved to DB yet)
        addTemporaryVersion(`${modificationType} Version`, modifiedRecipe);
        
        setIsModified(true);
        setIsAiModifying(false);
      }, 1500);
    } catch (error) {
      console.error("Error during AI modification:", error);
      toast({
        title: "Error",
        description: "Failed to modify recipe with AI",
        variant: "destructive"
      });
      setIsAiModifying(false);
    }
  };
  
  const handleAcceptChanges = async () => {
    if (currentRecipe) {
      try {
        // Find the active version (which should be temporary)
        const activeVersion = recipeVersions.find(v => v.id === currentRecipe.id);
        
        if (activeVersion?.isTemporary) {
          // Save the temporary version to the database
          await persistVersion(activeVersion.id);
          
          toast({
            title: "Changes Saved",
            description: "The recipe version has been saved to the database.",
          });
        } else {
          // Fall back to creating a new persisted version if needed
          await addRecipeVersion("Modified", currentRecipe);
          
          toast({
            title: "New Version Created",
            description: "A new recipe version has been saved.",
          });
        }
        
        setIsModified(false);
      } catch (error) {
        console.error("Error saving modifications:", error);
        toast({
          title: "Error Saving Changes",
          description: error instanceof Error ? error.message : "Failed to save changes",
          variant: "destructive"
        });
      }
    }
  };

  return {
    recipeData,
    isLoading,
    error,
    selectedIngredient,
    isModified,
    resetToOriginal,
    handleModifyWithAI,
    handleStartModification,
    handleAcceptChanges,
    setSelectedIngredient,
    handleSelectIngredient,
    isAiModifying
  };
};
