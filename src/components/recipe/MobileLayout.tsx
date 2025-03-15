
import React from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import ComparisonPanel from "./ComparisonPanel";
import AIModificationPanel from "./AIModificationPanel";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft } from "lucide-react";
import { useRecipe } from "@/context/RecipeContext";

interface MobileLayoutProps {
  recipe: Recipe | null;
  selectedIngredient: Ingredient | null;
  isModified: boolean;
  resetToOriginal: () => void;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  handleModifyWithAI: () => void;
  handleStartModification: (modificationType: string) => void;
  handleAcceptChanges: () => void;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  recipe,
  selectedIngredient,
  isModified,
  resetToOriginal,
  leftPanelOpen,
  rightPanelOpen,
  setLeftPanelOpen,
  setRightPanelOpen,
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

  // Render the slide-out left panel (AI Modification)
  const renderLeftPanel = () => {
    if (!leftPanelOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="sticky top-0 bg-white border-b z-10 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftPanelOpen(false)}
            className="text-gray-500"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Modify Recipe</h2>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
        <div className="p-4">
          <AIModificationPanel
            recipe={recipe}
            isOpen={true}
            onClose={() => setLeftPanelOpen(false)}
            onStartModification={handleStartModification}
            selectedIngredients={selectedIngredients}
            onRemoveIngredientSelection={removeIngredientSelection}
            customInstructions={customInstructions}
            onCustomInstructionsChange={setCustomInstructions}
          />
        </div>
      </div>
    );
  };
  
  // Render the slide-out right panel (Comparison)
  const renderRightPanel = () => {
    if (!rightPanelOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="sticky top-0 bg-white border-b z-10 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelOpen(false)}
            className="text-gray-500 mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Recipe Details</h2>
        </div>
        <div className="p-4">
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
    );
  };

  return (
    <>
      <div className="container mx-auto py-3 px-4">
        {recipe && (
          <>
            <RecipeHeader
              recipe={recipe}
              isModified={isModified}
              onModifyWithAI={handleModifyWithAI}
            />
            <div className="mt-6">
              <RecipeContent 
                recipe={recipe} 
                selectedIngredients={selectedIngredients}
                onSelectIngredient={handleSelectIngredient} 
              />
            </div>
          </>
        )}
      </div>
      
      {renderLeftPanel()}
      {renderRightPanel()}
      
      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 inset-x-0 p-3 flex gap-3 bg-white border-t">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setLeftPanelOpen(true)}
        >
          Modify
        </Button>
        <Button 
          className="flex-1"
          onClick={() => setRightPanelOpen(true)}
        >
          Details
        </Button>
      </div>
    </>
  );
};

export default MobileLayout;
