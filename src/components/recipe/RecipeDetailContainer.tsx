
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
    error,
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Recipe</h2>
            <p className="text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!recipeData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h2 className="text-xl font-semibold text-amber-700 mb-2">Recipe Not Found</h2>
            <p className="text-amber-600">The recipe you're looking for couldn't be found. You'll be redirected to the recipes page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-10 md:pt-12">
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
