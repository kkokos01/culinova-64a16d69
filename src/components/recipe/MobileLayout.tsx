
import React from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import RecipeVersionTabs from "./RecipeVersionTabs";
import { Button } from "@/components/ui/button";
import { useRecipe } from "@/context/recipe";
import ModificationPanel from "./ModificationPanel";
import { usePanelState } from "@/hooks/usePanelState";
import { Database, Loader2 } from "lucide-react";

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
  isAiModifying?: boolean;
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
  isAiModifying = false
}) => {
  const { 
    addRecipeVersion,
    selectedIngredients,
    persistVersion,
    activeVersionId,
    recipeVersions
  } = useRecipe();
  
  const modificationPanel = usePanelState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Get the active version to check if it's temporary
  const activeVersion = recipeVersions.find(v => v.id === activeVersionId);
  const isActiveVersionTemporary = activeVersion?.isTemporary || false;
  
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    onSelectIngredient(ingredient, action);
  };

  const handleSaveToDatabase = async () => {
    if (!recipe) return;
    
    try {
      setIsSaving(true);
      
      if (isActiveVersionTemporary && activeVersionId) {
        // Save temporary version to database
        await persistVersion(activeVersionId);
      } else {
        // Create a new version in the database
        await addRecipeVersion("Modified", recipe);
      }
      
      handleAcceptChanges();
      modificationPanel.close();
    } catch (error) {
      console.error("Error saving modifications:", error);
    } finally {
      setIsSaving(false);
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
          onAcceptModification={handleSaveToDatabase}
          onStartModification={startUnifiedModification}
          closePanel={modificationPanel.close}
          isMobile={true}
          isSaving={isSaving}
          isTemporary={isActiveVersionTemporary}
          isAiModifying={isAiModifying}
        />
      </div>
    );
  };

  return (
    <>
      <div className="container mx-auto py-3 px-3 pb-20"> {/* Reduced padding from py-4 px-4 */}
        {recipe && (
          <>
            <RecipeHeader
              recipe={recipe}
              isModified={isModified}
              onModifyWithAI={modificationPanel.open}
              isTemporary={isActiveVersionTemporary}
            />
            <div className="px-1 mt-2"> {/* Reduced mt-4 to mt-2 */}
              <RecipeVersionTabs />
              <div className="mt-2"> {/* Reduced mt-3 to mt-2 */}
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
          className="w-full bg-sage-500 hover:bg-sage-600 text-white font-medium shadow-md flex items-center justify-center"
          onClick={modificationPanel.open}
          disabled={isAiModifying}
        >
          {isAiModifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI Modifying Recipe...
            </>
          ) : (
            <>
              {isActiveVersionTemporary && (
                <Database className="mr-2 h-4 w-4" />
              )}
              {isActiveVersionTemporary ? 'Modify Recipe (Temporary)' : 'Modify Recipe'}
            </>
          )}
        </Button>
      </div>
    </>
  );
};

export default MobileLayout;
