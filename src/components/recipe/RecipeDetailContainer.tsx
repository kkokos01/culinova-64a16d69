
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Recipe, Ingredient } from "@/types";
import { useMediaQuery } from "@/hooks/use-mobile";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import { useRecipe } from "@/context/recipe";
import { AddToShoppingListModal } from "@/components/shopping/AddToShoppingListModal";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

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
  onOpenShoppingList: () => void;
}

export interface DesktopLayoutProps {
  recipe: Recipe;
  selectedIngredient: Ingredient | null;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
  isModified: boolean;
  resetToOriginal: () => void;
  handleModifyWithAI: () => void;
  handleStartModification: (modificationType: string) => void;
  handleAcceptChanges: () => Promise<void>;
  isAiModifying: boolean;
  onOpenShoppingList: () => void;
}

const RecipeDetailContainer: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Get direct access to the recipe from the RecipeContext to ensure we're always using
  // the latest recipe data from the active version
  const { recipe: contextRecipe } = useRecipe();
  
  const {
    recipeData: hookRecipe,
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

  // Use the context recipe as the source of truth if available, otherwise fall back to hook data
  // This ensures we always have the most up-to-date recipe data from the active version
  const recipe = contextRecipe || hookRecipe;

  const handleOpenShoppingList = () => {
    setIsShoppingListModalOpen(true);
  };

  const handleCloseShoppingList = () => {
    setIsShoppingListModalOpen(false);
  };

  const handleStartCooking = () => {
    if (recipe?.id) {
      navigate(`/recipes/${recipe.id}/cook`);
    }
  };

  // Log recipe content for debugging purposes
  useEffect(() => {
    if (recipe) {
      console.log("RecipeDetailContainer rendering with recipe:", recipe.title);
      console.log("Recipe ingredients count:", recipe.ingredients?.length || 0);
    }
  }, [recipe]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !recipe) {
    return <div>Error loading recipe</div>;
  }

  return (
    <>
      {isMobile ? (
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
          onOpenShoppingList={handleOpenShoppingList}
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
          onSelectIngredient={handleSelectIngredient}
          isAiModifying={isAiModifying}
          onOpenShoppingList={handleOpenShoppingList}
        />
      )}
      
      {/* Start Cooking FAB */}
      {recipe?.steps && recipe.steps.length > 0 && (
        <Button
          onClick={handleStartCooking}
          size="lg"
          className="fixed bottom-6 right-6 z-30 h-14 px-6 shadow-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          <ChefHat className="w-5 h-5 mr-2" />
          Start Cooking
        </Button>
      )}
      
      <AddToShoppingListModal
        isOpen={isShoppingListModalOpen}
        onClose={handleCloseShoppingList}
        recipe={recipe}
      />
    </>
  );
};

export default RecipeDetailContainer;
