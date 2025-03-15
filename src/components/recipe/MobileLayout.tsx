
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "@/components/recipe/RecipeHeader";
import RecipeContent from "@/components/recipe/RecipeContent";
import AIModificationPanel from "@/components/recipe/AIModificationPanel";
import ComparisonPanel from "@/components/recipe/ComparisonPanel";

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
  setSelectedIngredient
}) => {
  if (!recipe) return null;

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Left Panel Sheet - AI Modification Panel */}
      <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed left-4 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md"
            onClick={() => setLeftPanelOpen(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-[400px] overflow-y-auto">
          <div className="pt-6 pb-16">
            <AIModificationPanel 
              recipe={recipe}
              isOpen={leftPanelOpen}
              onClose={() => setLeftPanelOpen(false)}
              onStartModification={handleStartModification}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <RecipeHeader 
          recipe={recipe}
          onModifyWithAI={handleModifyWithAI}
        />
        <RecipeContent 
          recipe={recipe}
          onSelectIngredient={setSelectedIngredient}
        />
      </div>
      
      {/* Right Panel Sheet - Comparison Panel */}
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed right-4 top-1/2 -translate-y-1/2 z-20 rounded-full shadow-md"
            onClick={() => setRightPanelOpen(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[85vw] max-w-[400px] overflow-y-auto">
          <div className="pt-6 pb-16">
            <ComparisonPanel 
              recipe={recipe}
              originalRecipe={recipe}
              selectedIngredient={selectedIngredient}
              isModified={isModified}
              onResetToOriginal={resetToOriginal}
              onAcceptChanges={handleAcceptChanges}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileLayout;
