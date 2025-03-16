
import { useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import RecipeDetailSkeleton from "@/components/recipe/RecipeDetailSkeleton";
import MobileLayout from "@/components/recipe/MobileLayout";
import DesktopLayout from "@/components/recipe/DesktopLayout";
import { Toaster } from "@/components/ui/toaster";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import Navbar from "@/components/Navbar";

const RecipeDetailContainer = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
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
    handleSelectIngredient
  } = useRecipeDetail();

  if (isLoading) return <RecipeDetailSkeleton />;
  
  if (!recipeData) return null; // Will redirect due to the useEffect in useRecipeDetail

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-10 md:pt-12"> {/* Reduced padding from pt-12 md:pt-16 */}
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
          />
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default RecipeDetailContainer;
