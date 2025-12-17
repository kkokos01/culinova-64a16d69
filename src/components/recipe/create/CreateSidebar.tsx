import React from "react";
import { Recipe } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronLeft, Wand2, Loader2 } from "lucide-react";
import ConceptInput from "./ConceptInput";
import ConstraintSelector from "./ConstraintSelector";
import AILoadingProgress from "@/components/ui/AILoadingProgress";
import type { UserStyle } from "@/lib/llmTypes";

interface CreateSidebarProps {
  concept: string;
  selectedQuickConcept: string;
  dietaryConstraints: string[];
  timeConstraints: string[];
  skillLevel: string;
  excludedIngredients: string[];
  spicinessLevel: number;
  targetServings: number;
  userStyle: UserStyle;
  isGenerating: boolean;
  isSaving: boolean;
  onConceptChange: (concept: string) => void;
  onQuickConceptSelect: (concept: string) => void;
  onDietaryChange: (constraints: string[]) => void;
  onTimeChange: (constraints: string[]) => void;
  onSkillChange: (level: string) => void;
  onExclusionsChange: (ingredients: string[]) => void;
  onSpicinessChange: (level: number) => void;
  onServingsChange: (servings: number) => void;
  onUserStyleChange: (userStyle: UserStyle) => void;
  onGenerateRecipe: () => void;
  onSaveRecipe: () => Promise<void>;
  onTogglePanel: () => void;
  isPanelCollapsed: boolean;
}

const CreateSidebar: React.FC<CreateSidebarProps> = ({
  concept,
  selectedQuickConcept,
  dietaryConstraints,
  timeConstraints,
  skillLevel,
  excludedIngredients,
  spicinessLevel,
  targetServings,
  userStyle,
  isGenerating,
  isSaving,
  onConceptChange,
  onQuickConceptSelect,
  onDietaryChange,
  onTimeChange,
  onSkillChange,
  onExclusionsChange,
  onSpicinessChange,
  onServingsChange,
  onUserStyleChange,
  onGenerateRecipe,
  onSaveRecipe,
  onTogglePanel,
  isPanelCollapsed
}) => {
  if (isPanelCollapsed) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-sage-600/60 transition-colors"
        onClick={onTogglePanel}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-2 text-white hover:text-white hover:bg-sage-600/60 pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="rotate-90 whitespace-nowrap text-base font-medium text-white flex items-center space-x-2">
          <Wand2 className="h-4 w-4 transform -rotate-90 mr-2" />
          <span>Recipe Creation</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      <Card className="rounded-none border-x-0 border-t-0 border-b border-white/20 shadow-none">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-sage-600">Create Recipe</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onTogglePanel}
            className="text-sage-600 hover:text-sage-600 hover:bg-sage-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
      
      <div className="p-4 space-y-6">
        <p className="text-black mb-6">Create a new recipe with AI assistance</p>
        
        {/* Concept Input */}
        <ConceptInput
          concept={concept}
          onConceptChange={onConceptChange}
          onQuickConceptSelect={onQuickConceptSelect}
        />

        {/* Constraint Selector */}
        <ConstraintSelector
          dietaryConstraints={dietaryConstraints}
          timeConstraints={timeConstraints}
          skillLevel={skillLevel}
          excludedIngredients={excludedIngredients}
          spicinessLevel={spicinessLevel}
          targetServings={targetServings}
          userStyle={userStyle}
          onDietaryChange={onDietaryChange}
          onTimeChange={onTimeChange}
          onSkillChange={onSkillChange}
          onExclusionsChange={onExclusionsChange}
          onSpicinessChange={onSpicinessChange}
          onServingsChange={onServingsChange}
          onUserStyleChange={onUserStyleChange}
          usePantry={false}
          pantryMode="ignore"
          onUsePantryChange={() => {}}
          onPantryModeChange={() => {}}
        />

        {/* Generate Button */}
        <Button
          onClick={onGenerateRecipe}
          disabled={!concept.trim() || isGenerating}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Recipe...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Recipe
            </>
          )}
        </Button>
        
        <AILoadingProgress
          isLoading={isGenerating}
          message="AI is generating recipe..."
          className="mt-4"
        />

        {/* Save Button (only show when recipe is generated) */}
        <AILoadingProgress
          isLoading={isSaving}
          message="Saving recipe..."
          className="mt-4"
        />
      </div>
    </div>
  );
};

export default CreateSidebar;
