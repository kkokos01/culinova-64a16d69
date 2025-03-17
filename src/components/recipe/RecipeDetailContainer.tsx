
import React, { useState } from "react";
import { Recipe, Ingredient } from "@/types";
import { useMediaQuery } from "@/hooks/use-mobile";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";

export interface MobileLayoutProps {
  recipe: Recipe;
  selectedIngredient: Ingredient | null;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  handleSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
  isModified: boolean;
  resetToOriginal: () => void;
  handleModifyWithAI: () => void;
  handleStartModification: (modificationType: string) => void;
  handleAcceptChanges: () => Promise<void>;
  isAiModifying: boolean;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  removeIngredientSelection: (id: string) => void;
}

const RecipeDetailContainer: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const {
    recipeData: recipe,
    isLoading,
    error,
    selectedIngredient,
    selectedIngredients,
    isModified,
    resetToOriginal,
    handleModifyWithAI,
    handleStartModification,
    handleAcceptChanges,
    setSelectedIngredient,
    handleSelectIngredient,
    isAiModifying,
    removeIngredientSelection
  } = useRecipeDetail();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !recipe) {
    return <div>Error loading recipe</div>;
  }

  return isMobile ? (
    <MobileLayout
      recipe={recipe}
      selectedIngredient={selectedIngredient}
      isModified={isModified}
      resetToOriginal={resetToOriginal}
      handleModifyWithAI={handleModifyWithAI}
      handleStartModification={handleStartModification}
      handleAcceptChanges={handleAcceptChanges}
      setSelectedIngredient={setSelectedIngredient}
      handleSelectIngredient={handleSelectIngredient}
      isAiModifying={isAiModifying}
      selectedIngredients={selectedIngredients}
      removeIngredientSelection={removeIngredientSelection}
    />
  ) : (
    <DesktopLayout
      recipe={recipe}
      selectedIngredient={selectedIngredient}
      isModified={isModified}
      resetToOriginal={resetToOriginal}
      handleModifyWithAI={handleModifyWithAI}
      handleStartModification={handleStartModification}
      handleAcceptChanges={handleAcceptChanges}
      setSelectedIngredient={setSelectedIngredient}
      handleSelectIngredient={handleSelectIngredient}
      isAiModifying={isAiModifying}
    />
  );
};

export default RecipeDetailContainer;
