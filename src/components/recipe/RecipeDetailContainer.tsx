
import React from "react";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";
import RecipeDetailSkeleton from "./RecipeDetailSkeleton";

const RecipeDetailContainer: React.FC = () => {
  const isMobile = useIsMobile();
  const { 
    recipeData, 
    isLoading, 
    selectedIngredient,
    isModified,
    resetToOriginal,
    handleModifyWithAI,
    handleStartModification,
    handleAcceptChanges,
    setSelectedIngredient,
    handleSelectIngredient,
    isAiModifying
  } = useRecipeDetail();

  if (isLoading) {
    return <RecipeDetailSkeleton />;
  }

  return (
    <>
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
          isAiModifying={isAiModifying}
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
          isAiModifying={isAiModifying}
        />
      )}
    </>
  );
};

export default RecipeDetailContainer;
