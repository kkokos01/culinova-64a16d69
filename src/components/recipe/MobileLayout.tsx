
import React from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import UnifiedModificationPanel from "./UnifiedModificationPanel";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRecipe } from "@/context/recipe";

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
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
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
  onSelectIngredient,
}) => {
  const { 
    selectedIngredients, 
    customInstructions,
    addRecipeVersion,
    selectIngredientForModification, 
    removeIngredientSelection,
    setCustomInstructions 
  } = useRecipe();
  
  // Update this function to use the onSelectIngredient prop directly
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    onSelectIngredient(ingredient, action);
  };

  // Handle AI modification acceptance
  const handleAcceptModification = () => {
    if (recipe) {
      // Create a new version
      addRecipeVersion("Modified", recipe);
      handleAcceptChanges();
      setLeftPanelOpen(false);
    }
  };

  // Start modification with any type - our new panel doesn't distinguish by type
  const startUnifiedModification = () => {
    handleStartModification("unified");
  };

  // Render the slide-out left panel (AI Modification)
  const renderLeftPanel = () => {
    if (!leftPanelOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="sticky top-0 bg-gradient-to-r from-sage-50 to-sage-100 border-b border-sage-200 z-10 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftPanelOpen(false)}
            className="text-sage-500 hover:text-sage-700 hover:bg-sage-100/80"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-sage-800">Modify Recipe</h2>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
        <div className="p-4">
          <UnifiedModificationPanel
            recipe={recipe}
            selectedIngredients={selectedIngredients}
            onRemoveIngredientSelection={removeIngredientSelection}
            customInstructions={customInstructions}
            onCustomInstructionsChange={setCustomInstructions}
            onStartModification={startUnifiedModification}
          />
          
          {isModified && (
            <div className="mt-6 flex flex-col gap-2">
              <Button 
                variant="outline"
                onClick={resetToOriginal}
                className="w-full border-sage-300 hover:bg-sage-50"
              >
                Reset to Original
              </Button>
              <Button 
                onClick={handleAcceptModification}
                className="w-full bg-sage-500 hover:bg-sage-600"
              >
                Save as New Version
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="container mx-auto py-6 px-4 pb-20">
        {recipe && (
          <>
            <RecipeHeader
              recipe={recipe}
              isModified={isModified}
              onModifyWithAI={handleModifyWithAI}
            />
            <div className="px-1 mt-6">
              <RecipeVersionTabs />
              <div className="mt-4">
                <RecipeContent 
                  recipe={recipe} 
                  selectedIngredients={selectedIngredients}
                  onSelectIngredient={handleSelectIngredient} 
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      {renderLeftPanel()}
      
      {/* Fixed bottom button */}
      <div className="fixed bottom-0 inset-x-0 p-3 bg-white border-t">
        <Button 
          className="w-full bg-sage-500 hover:bg-sage-600"
          onClick={() => setLeftPanelOpen(true)}
        >
          Modify Recipe
        </Button>
      </div>
    </>
  );
};

export default MobileLayout;
