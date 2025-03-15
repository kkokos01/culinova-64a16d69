
import React from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import ComparisonPanel from "./ComparisonPanel";
import AIModificationPanel from "./AIModificationPanel";
import { useRecipe } from "@/context/RecipeContext";

interface DesktopLayoutProps {
  recipe: Recipe | null;
  selectedIngredient: Ingredient | null;
  isModified: boolean;
  resetToOriginal: () => void;
  handleModifyWithAI: () => void;
  handleStartModification: (modificationType: string) => void;
  handleAcceptChanges: () => void;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  recipe,
  selectedIngredient,
  isModified,
  resetToOriginal,
  handleModifyWithAI,
  handleStartModification,
  handleAcceptChanges,
  setSelectedIngredient,
}) => {
  const { 
    originalRecipe, 
    selectedIngredients, 
    customInstructions,
    selectIngredientForModification, 
    removeIngredientSelection,
    setCustomInstructions
  } = useRecipe();

  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove") => {
    setSelectedIngredient(ingredient);
    selectIngredientForModification(ingredient, action);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {recipe && (
        <>
          <RecipeHeader
            recipe={recipe}
            isModified={isModified}
            onModifyWithAI={handleModifyWithAI}
          />

          <div className="mt-8 grid grid-cols-12 gap-6">
            {/* Left Panel - AI Modification */}
            <div className="col-span-12 md:col-span-3 lg:col-span-3">
              <div className="sticky top-20">
                <AIModificationPanel
                  recipe={recipe}
                  isOpen={true}
                  onClose={() => {}}
                  onStartModification={handleStartModification}
                  selectedIngredients={selectedIngredients}
                  onRemoveIngredientSelection={removeIngredientSelection}
                  customInstructions={customInstructions}
                  onCustomInstructionsChange={setCustomInstructions}
                />
              </div>
            </div>

            {/* Main Content - Recipe */}
            <div className="col-span-12 md:col-span-6 lg:col-span-6">
              <RecipeContent 
                recipe={recipe} 
                selectedIngredients={selectedIngredients}
                onSelectIngredient={handleSelectIngredient} 
              />
            </div>

            {/* Right Panel - Comparison */}
            <div className="col-span-12 md:col-span-3 lg:col-span-3">
              <div className="sticky top-20">
                <ComparisonPanel
                  recipe={recipe}
                  originalRecipe={originalRecipe}
                  selectedIngredient={selectedIngredient}
                  isModified={isModified}
                  onResetToOriginal={resetToOriginal}
                  onAcceptChanges={handleAcceptChanges}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopLayout;
