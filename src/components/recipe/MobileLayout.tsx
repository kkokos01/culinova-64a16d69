
import React from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { Button } from "@/components/ui/button";
import { useRecipe } from "@/context/recipe";
import ModificationPanel from "./ModificationPanel";
import { usePanelState } from "@/hooks/usePanelState";

interface MobileLayoutProps {
  recipe: Recipe | null;
  selectedIngredient: Ingredient | null;
  isModified: boolean;
  resetToOriginal: () => void;
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
  handleModifyWithAI,
  handleStartModification,
  handleAcceptChanges,
  setSelectedIngredient,
  onSelectIngredient,
}) => {
  const { 
    addRecipeVersion,
    selectedIngredients,
  } = useRecipe();
  
  const modificationPanel = usePanelState(false);
  
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    onSelectIngredient(ingredient, action);
  };

  const handleAcceptModification = () => {
    if (recipe) {
      addRecipeVersion("Modified", recipe);
      handleAcceptChanges();
      modificationPanel.close();
    }
  };

  const startUnifiedModification = () => {
    handleStartModification("unified");
  };

  const renderModificationPanel = () => {
    if (!modificationPanel.isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-sage-400 text-white z-50 overflow-hidden">
        <ModificationPanel
          recipe={recipe}
          isModified={isModified}
          resetToOriginal={resetToOriginal}
          onAcceptModification={handleAcceptModification}
          onStartModification={startUnifiedModification}
          closePanel={modificationPanel.close}
          isMobile={true}
        />
      </div>
    );
  };

  return (
    <>
      <div className="container mx-auto py-4 px-4 pb-20"> {/* Reduced py-6 to py-4 */}
        {recipe && (
          <>
            <RecipeHeader
              recipe={recipe}
              isModified={isModified}
              onModifyWithAI={modificationPanel.open}
            />
            <div className="px-1 mt-4"> {/* Reduced mt-6 to mt-4 */}
              <RecipeVersionTabs />
              <div className="mt-3"> {/* Reduced mt-4 to mt-3 */}
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
      
      {renderModificationPanel()}
      
      <div className="fixed bottom-0 inset-x-0 p-3 bg-white border-t">
        <Button 
          className="w-full bg-sage-500 hover:bg-sage-600 text-white font-medium shadow-md"
          onClick={modificationPanel.open}
        >
          Modify Recipe
        </Button>
      </div>
    </>
  );
};

export default MobileLayout;
