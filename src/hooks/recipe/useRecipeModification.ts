
import { useState } from "react";
import { Ingredient, Recipe } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { aiRecipeGenerator, AIRecipeModificationRequest } from "@/services/ai/recipeGenerator";

export const useRecipeModification = (recipe: Recipe | null, addTemporaryVersion: ((name: string, recipe: Recipe) => any) | null) => {
  const { toast } = useToast();
  
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>>(
    new Map()
  );
  const [customInstructions, setCustomInstructions] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [isAiModifying, setIsAiModifying] = useState(false);

  // Select an ingredient for modification
  const selectIngredientForModification = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    console.log("Selecting ingredient in useRecipeModification:", ingredient.id, action);
    
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      
      // If action is null, deselect the ingredient
      if (action === null) {
        console.log("Removing ingredient selection:", ingredient.id);
        newMap.delete(ingredient.id);
      } else {
        // Otherwise, set the action
        console.log("Setting ingredient action:", ingredient.id, action);
        newMap.set(ingredient.id, { ingredient, action });
      }
      
      return newMap;
    });
  };

  // Remove an ingredient from the selection
  const removeIngredientSelection = (id: string) => {
    console.log("Removing ingredient selection by ID in useRecipeModification:", id);
    
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  // Handle starting an AI-based modification
  const handleStartModification = async (modificationType: string) => {
    if (!recipe) return;
    
    console.log("Starting modification with instructions:", modificationType);
    console.log("Selected ingredients:", Array.from(selectedIngredients.entries()));
    
    setIsAiModifying(true);
    
    try {
      // Build modification request
      const modificationRequest: AIRecipeModificationRequest = {
        baseRecipe: recipe,
        modificationInstructions: modificationType,
        selectedIngredients: selectedIngredients
      };
      
      // Call real AI modification service
      const aiResponse = await aiRecipeGenerator.modifyRecipe(modificationRequest);
      
      // Check if AI returned an error
      if ('type' in aiResponse) {
        throw new Error(aiResponse.message);
      }
      
      // Transform AI response to Recipe type
      const modifiedRecipe: Recipe = {
        ...recipe, // Keep original recipe properties
        title: aiResponse.title,
        description: aiResponse.description,
        prep_time_minutes: aiResponse.prepTimeMinutes,
        cook_time_minutes: aiResponse.cookTimeMinutes,
        servings: aiResponse.servings,
        difficulty: aiResponse.difficulty,
        ingredients: aiResponse.ingredients.map((ing, index) => ({
          id: `ing-${index}`,
          recipe_id: recipe.id,
          food_id: null,
          unit_id: null,
          food_name: ing.name.toLowerCase(),
          unit_name: ing.unit.toLowerCase(),
          amount: parseFloat(ing.amount) || 1,
        })),
        steps: aiResponse.steps.map((step, index) => ({
          id: `step-${index}`,
          recipe_id: recipe.id,
          order_number: index + 1,
          instruction: step,
        })),
        tags: aiResponse.tags,
        updated_at: new Date().toISOString(),
      };
      
      // Add modified recipe as temporary version
      if (addTemporaryVersion) {
        await addTemporaryVersion("AI Modified", modifiedRecipe);
      }
      
      setIsModified(true);
      
      toast({
        title: "Recipe Modified",
        description: "Recipe has been successfully modified with AI",
      });
    } catch (error) {
      console.error("Error during AI modification:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to modify recipe with AI",
        variant: "destructive"
      });
    } finally {
      setIsAiModifying(false);
    }
  };

  // Handle saving changes
  const handleSaveChanges = async () => {
    try {
      toast({
        title: "Changes Saved",
        description: "Your modifications have been saved.",
      });
      
      setIsModified(false);
    } catch (error) {
      console.error("Error saving modifications:", error);
      
      toast({
        title: "Error",
        description: "Failed to save modifications.",
        variant: "destructive"
      });
    }
  };

  return {
    selectedIngredient,
    setSelectedIngredient,
    selectedIngredients,
    selectIngredientForModification,
    removeIngredientSelection,
    customInstructions,
    setCustomInstructions,
    isModified,
    setIsModified,
    isAiModifying,
    setIsAiModifying,
    handleStartModification,
    handleSaveChanges
  };
};
