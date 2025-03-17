
import React from "react";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./MobileLayout";
import RecipeDetailSkeleton from "./RecipeDetailSkeleton";
import Navbar from "@/components/Navbar";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {isLoading ? (
        <RecipeDetailSkeleton />
      ) : (
        <div className="pt-16"> {/* Add padding top to account for fixed navbar */}
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
        </div>
      )}
    </div>
  );
};

export default RecipeDetailContainer;
