import React, { useState, useEffect, useRef } from "react";
import { Recipe, Ingredient } from "@/types";
import RecipeHeader from "./RecipeHeader";
import RecipeContent from "./RecipeContent";
import { useRecipe } from "@/context/recipe";
import { useSpace } from "@/context/SpaceContext";
import { useAuth } from "@/context/AuthContext";
import { useUnifiedModificationState } from "@/hooks/recipe/useUnifiedModificationState";
import { useToast } from "@/hooks/use-toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronRight, Wand2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import UnifiedSidebar from "./create/UnifiedSidebar";
import VersionManagement from "./VersionManagement";
import { aiRecipeGenerator, AIRecipeModificationRequest } from "@/services/ai/recipeGenerator";
import { foodUnitMapper } from "@/services/ai/foodUnitMapper";

interface DesktopLayoutProps {
  recipe: Recipe | null;
  selectedIngredient: Ingredient | null;
  isModified: boolean;
  resetToOriginal: () => void;
  handleModifyWithAI: () => void;
  handleStartModification: (modificationType: string) => void;
  handleAcceptChanges: () => void;
  setSelectedIngredient: (ingredient: Ingredient | null) => void;
  onSelectIngredient: (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => void;
  onOpenShoppingList: () => void;
  isAiModifying: boolean;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  recipe,
  selectedIngredient,
  isModified,
  resetToOriginal,
  handleModifyWithAI,
  handleStartModification,
  handleAcceptChanges,
  setSelectedIngredient,
  onSelectIngredient,
  onOpenShoppingList,
  isAiModifying
}) => {
  const { 
    selectedIngredients, 
    customInstructions,
    recipeVersions,
    isLoadingVersions,
    selectIngredientForModification, 
    removeIngredientSelection,
    setCustomInstructions,
    addRecipeVersion,
    addTemporaryVersion,
    persistVersion,
    deleteVersion,
    activeVersionId
  } = useRecipe();
  
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  const { user } = useAuth(); // Add user access for pantry loading
  const [leftPanelSize, setLeftPanelSize] = useState(5);
  const [rightPanelSize, setRightPanelSize] = useState(95);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocalAiModifying, setIsLocalAiModifying] = useState(false);
  const [isModificationComplete, setIsModificationComplete] = useState(false);
  const [hasUserManuallyResized, setHasUserManuallyResized] = useState(false);
  
  // Ref for sidebar panel and button positioning
  const sidebarPanelRef = useRef<HTMLDivElement>(null);
  const resizablePanelRef = useRef<any>(null); // Ref for ResizablePanel component
  const [buttonPosition, setButtonPosition] = useState({ left: 0 });
  
  // Handle panel expansion/collapse when clicking overlay
  const handleOverlayClick = () => {
    console.log('🔍 handleOverlayClick called - current leftPanelSize:', leftPanelSize);
    if (leftPanelSize >= 50) {
      console.log('🔍 Collapsing panel from', leftPanelSize, 'to 5');
      setLeftPanelSize(5);
      setRightPanelSize(95);
      setHasUserManuallyResized(true);
    } else {
      console.log('🔍 Expanding panel from', leftPanelSize, 'to 95');
      setLeftPanelSize(95);
      setRightPanelSize(5);
      setHasUserManuallyResized(true);
    }
  };
  
  // UnifiedSidebar state management
  const {
    userInput,
    selectedQuickConcept,
    dietaryConstraints,
    timeConstraints,
    skillLevel,
    costPreference,
    excludedIngredients,
    spicinessLevel,
    targetServings,
    selectedInspiration,
    isPanelCollapsed,
    
    // Pantry state
    usePantry,
    pantryMode,
    pantryItems,
    selectedPantryItemIds,
    
    handleUserInputChange,
    handleQuickConceptSelect,
    handleInspirationSelect,
    handleDietaryChange,
    handleTimeChange,
    handleSkillChange,
    handleCostChange,
    handleExclusionsChange,
    handleSpicinessChange,
    handleServingsChange,
    handleTogglePanel,
    
    // Pantry handlers
    handlePantryModeChange,
    handleSelectionChange,
    handleUsePantryChange,
    loadPantryItems,
    
    buildModificationRequest
  } = useUnifiedModificationState();
  
  const activeVersion = recipeVersions.find(v => v.id === activeVersionId);
  const isActiveVersionTemporary = activeVersion?.isTemporary || false;
  
  useEffect(() => {
    // Only auto-adjust panel size if user hasn't manually resized
    if (!hasUserManuallyResized) {
      if (isPanelCollapsed) {
        setLeftPanelSize(5);
        setRightPanelSize(95);
      } else {
        // Keep collapsed for viewing mode until user clicks to modify
        setLeftPanelSize(5);
        setRightPanelSize(95);
      }
    }
  }, [isPanelCollapsed, hasUserManuallyResized]);

  // Load pantry items when user and pantry mode are available
  useEffect(() => {
    if (user && usePantry) {
      loadPantryItems(user.id, currentSpace?.id);
    }
  }, [user, usePantry, currentSpace?.id, loadPantryItems]);

  // Update button position when sidebar resizes
  useEffect(() => {
    const updateButtonPosition = () => {
      if (sidebarPanelRef.current) {
        const rect = sidebarPanelRef.current.getBoundingClientRect();
        const buttonWidth = 160; // min-w-[160px]
        const centerPosition = rect.left + rect.width / 2 - buttonWidth / 2;
        
        console.log('Button position debug:', {
          rectLeft: rect.left,
          rectWidth: rect.width,
          centerPosition,
          buttonPosition
        });
        
        setButtonPosition({ left: centerPosition });
      } else {
        console.log('Sidebar ref is null');
      }
    };

    updateButtonPosition();
    
    // Listen for resize events
    const resizeObserver = new ResizeObserver(updateButtonPosition);
    if (sidebarPanelRef.current) {
      resizeObserver.observe(sidebarPanelRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [leftPanelSize, isPanelCollapsed, isAiModifying]);

  // Handler for clicking on left panel background to toggle between 95% and 5% states
  const handleLeftPanelBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking directly on the panel (not on child elements)
    if (event.target === event.currentTarget) {
      if (leftPanelSize >= 50) {
        // Currently large, make it small
        setLeftPanelSize(5);
        setHasUserManuallyResized(true); // Mark as manually resized to prevent auto-switching
      } else {
        // Currently small, make it large
        setLeftPanelSize(95);
        setHasUserManuallyResized(true); // Mark as manually resized to prevent auto-switching
      }
    }
  };

  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    onSelectIngredient(ingredient, action);
  };

  const handleSaveToDatabase = async () => {
    if (!recipe) return;
    
    setIsSaving(true);
    try {
      if (isActiveVersionTemporary && activeVersionId) {
        await persistVersion(activeVersionId);
        toast({
          title: "Version Saved",
          description: "Recipe version has been saved to the database.",
        });
      } else {
        await handleAcceptChanges();
      }
    } catch (error) {
      console.error("Error saving to database:", error);
      toast({
        title: "Error Saving Version",
        description: error instanceof Error ? error.message : "Failed to save version",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleApplyModifications = async () => {
    if (!recipe) return;
    
    setIsLocalAiModifying(true);
    setIsModificationComplete(false); // Reset completion state
    
    toast({ title: "Modifying Recipe...", description: "AI is modifying your recipe...", variant: "default" });
    
    // Build modification instructions from all inputs (matching RecipeCreatePage pattern)
    const effectiveUserInput = userInput.trim();
    const effectiveQuickConcept = selectedQuickConcept;
    const effectiveInspiration = selectedInspiration;
    
    // Combine all inputs for the modification instructions
    const combinedInputs = [effectiveUserInput, effectiveQuickConcept, effectiveInspiration].filter(Boolean).join('. ');
    
    if (!combinedInputs && selectedIngredients.size === 0) {
      toast({
        title: "Input Required",
        description: "Please add modification instructions or select ingredients to modify.",
        variant: "destructive"
      });
      return;
    }

    setIsLocalAiModifying(true);

    // Show modification toast (matching RecipeCreatePage)
    toast({
      title: "Modifying Recipe...",
      description: "AI is modifying your recipe based on your selections and instructions. This may take a moment.",
      variant: "default",
    });

    try {
      // Use the hook's buildModificationRequest function to include all advanced options
      const modificationRequest = buildModificationRequest(recipe, selectedIngredients);

      const response = await aiRecipeGenerator.modifyRecipe(modificationRequest);

      if ('type' in response) {
        throw new Error(response.message);
      }

      // Transform AI response to Recipe type (matching RecipeCreatePage pattern)
      const modifiedRecipe: Recipe = {
        ...recipe, // Keep original recipe properties
        title: response.title,
        description: response.description,
        prep_time_minutes: response.prepTimeMinutes,
        cook_time_minutes: response.cookTimeMinutes,
        servings: response.servings,
        difficulty: response.difficulty,
        ingredients: response.ingredients.map((ing, index) => ({
          id: `ing-${index}`,
          recipe_id: recipe.id,
          food_id: null,
          unit_id: null,
          food_name: ing.name.toLowerCase(),
          unit_name: ing.unit.toLowerCase(),
          amount: parseFloat(ing.amount) || 1,
        })),
        steps: response.steps.map((step, index) => ({
          id: `step-${index}`,
          recipe_id: recipe.id,
          order_number: index + 1,
          instruction: step,
        })),
        tags: response.tags,
        updated_at: new Date().toISOString(),
      };
      
      // Map AI-generated ingredients to database foods (matching RecipeCreatePage pattern)
      console.log('Starting ingredient mapping for modification...');
      if (!currentSpace) {
        throw new Error('No current space found for ingredient mapping');
      }

      console.log('AI response ingredients:', response.ingredients);
      console.log('Current space ID:', currentSpace.id);

      const mappedIngredients = await Promise.all(
        response.ingredients.map(async (ing) => {
          console.log('Mapping ingredient:', ing);
          const foodResult = await foodUnitMapper.findOrCreateFood(ing.name, currentSpace.id);
          const unitResult = await foodUnitMapper.findOrCreateUnit(ing.unit);
          
          console.log('Food mapping result:', foodResult);
          console.log('Unit mapping result:', unitResult);
          
          const mappedIngredient = {
            id: `ing-${Date.now()}-${Math.random()}`,
            recipe_id: recipe.id,
            food_id: foodResult.food_id || null,
            unit_id: unitResult.unit_id || null,
            food_name: foodResult.food_name,
            unit_name: unitResult.unit_name,
            amount: parseFloat(ing.amount) || 1,
          };
          
          console.log('Mapped ingredient:', mappedIngredient);
          return mappedIngredient;
        })
      );

      console.log('All mapped ingredients:', mappedIngredients);

      // Update the modified recipe with mapped ingredients
      modifiedRecipe.ingredients = mappedIngredients;
      console.log('Modified recipe with mapped ingredients:', modifiedRecipe);
      
      console.log('Available functions from useRecipe:', {
  addTemporaryVersion: typeof addTemporaryVersion,
  addRecipeVersion: typeof addRecipeVersion,
  persistVersion: typeof persistVersion,
  deleteVersion: typeof deleteVersion
});

      // Add modified recipe as temporary version (not persisted to DB)
      if (addTemporaryVersion && typeof addTemporaryVersion === 'function') {
        console.log('✅ Using addTemporaryVersion (session-only)');
        console.log('Version name to use:', modifiedRecipe.title);
        console.log('Recipe to save:', modifiedRecipe);
        
        const result = addTemporaryVersion(modifiedRecipe.title || "AI Modified", modifiedRecipe);
        console.log('addTemporaryVersion completed successfully with result:', result);
        console.log('Result isTemporary:', result?.isTemporary);
        
        // Mark modification as complete to trigger UI updates
        setIsModificationComplete(true);
      } else {
        console.error('❌ addTemporaryVersion function is not available or not a function!');
        console.error('addTemporaryVersion:', addTemporaryVersion);
        
        // Fallback to addRecipeVersion if temporary not available (for debugging)
        if (addRecipeVersion) {
          console.log('⚠️ Falling back to addRecipeVersion (this will persist to DB)');
          const result = await addRecipeVersion(modifiedRecipe.title || "AI Modified", modifiedRecipe);
          console.log('addRecipeVersion completed with result:', result);
        }
      }

      toast({
        title: "Recipe Modified!",
        description: "Your recipe has been updated. You can continue modifying or save it.",
      });

    } catch (error) {
      console.error("Error during AI modification:", error);
      toast({
        title: "Modification Failed",
        description: error instanceof Error ? error.message : "Failed to modify recipe with AI",
        variant: "destructive"
      });
    } finally {
      setIsLocalAiModifying(false);
    }
  };

  if (!recipe) return null;

  return (
    <div className="container mx-auto py-2 px-3">
      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-100px)] rounded-lg border">
        <ResizablePanel 
          defaultSize={5}
          size={leftPanelSize}
          minSize={5}
          maxSize={100}
          collapsible
          collapsedSize={5}
          onCollapse={() => {
            handleTogglePanel();
          }}
          onExpand={() => {
            handleTogglePanel();
          }}
          onResize={(size) => {
            console.log('🔍 onResize called - size:', size, 'type:', typeof size);
            setLeftPanelSize(size);
            // Track if user has manually resized (with tolerance for floating-point precision)
            if (Math.abs(size - 5) > 0.1 && Math.abs(size - 95) > 0.1) {
              setHasUserManuallyResized(true);
            }
          }}
          ref={resizablePanelRef}
          className={`relative transition-all duration-300 cursor-pointer ${
            isPanelCollapsed 
              ? "bg-sage-500 text-white" 
              : "bg-sage-500 text-white shadow-lg"
          }`}
        >
          <UnifiedSidebar
            mode="modify"
            recipe={recipe}
            isPanelCollapsed={isPanelCollapsed}
            onTogglePanel={handleTogglePanel}
            userInput={userInput}
            onUserInputChange={handleUserInputChange}
            selectedQuickConcept={selectedQuickConcept}
            onQuickConceptSelect={handleQuickConceptSelect}
            selectedInspiration={selectedInspiration}
            onInspirationSelect={handleInspirationSelect}
            dietaryConstraints={dietaryConstraints}
            timeConstraints={timeConstraints}
            skillLevel={skillLevel}
            costPreference={costPreference}
            excludedIngredients={excludedIngredients}
            spicinessLevel={spicinessLevel}
            targetServings={targetServings}
            onDietaryChange={handleDietaryChange}
            onTimeChange={handleTimeChange}
            onSkillChange={handleSkillChange}
            onCostChange={handleCostChange}
            onExclusionsChange={handleExclusionsChange}
            onSpicinessChange={handleSpicinessChange}
            onServingsChange={handleServingsChange}
            
            // Pantry settings
            usePantry={usePantry}
            pantryMode={pantryMode}
            pantryItems={pantryItems}
            selectedPantryItemIds={selectedPantryItemIds}
            onUsePantryChange={handleUsePantryChange}
            onPantryModeChange={handlePantryModeChange}
            onSelectionChange={handleSelectionChange}
            
            selectedIngredients={selectedIngredients}
            onRemoveIngredientSelection={removeIngredientSelection}
            isGenerating={isAiModifying}
            isSaving={isSaving}
          />
          
          {/* Clickable overlay for header area when expanded */}
          {leftPanelSize >= 15 && (
            <div 
              onClick={handleOverlayClick}
              className="absolute top-0 left-0 right-0 h-16 cursor-pointer z-10 hover:bg-sage-600/20 transition-colors"
              style={{ pointerEvents: 'auto' }}
            />
          )}
          
          {/* Collapsed state indicator - arrow for expanding */}
          {leftPanelSize < 15 && recipe && (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Overlay clicked! Stopping propagation and calling handleOverlayClick');
                handleOverlayClick();
              }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-start pt-8 bg-sage-500 cursor-pointer hover:bg-sage-600 transition-colors"
              style={{ pointerEvents: 'auto' }}
            >
              <ChevronRight className="h-4 w-4 text-white animate-pulse" />
              <span 
                className="text-xs text-white mt-2 font-medium"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                Modify Recipe
              </span>
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={65} className="bg-white overflow-y-auto">
          <div className="p-4">
            <RecipeHeader
              recipe={recipe}
              isModified={isModified}
              onModifyWithAI={handleTogglePanel}
              showModifyButton={isPanelCollapsed}
              isTemporary={isActiveVersionTemporary}
              onOpenShoppingList={onOpenShoppingList}
            />

            <VersionManagement 
              isActiveVersionTemporary={isActiveVersionTemporary}
              onSaveToDatabase={handleSaveToDatabase}
            />
            
            <RecipeContent 
              recipe={recipe} 
              selectedIngredients={selectedIngredients}
              onSelectIngredient={onSelectIngredient} 
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Floating Action Button */}
      {!isPanelCollapsed && (
        <div
          className="fixed bottom-6 z-50 min-w-[160px]"
          style={{ left: `${buttonPosition.left}px` }}
        >
          <Button
            onClick={handleApplyModifications}
            disabled={isAiModifying || (!userInput.trim() && !selectedQuickConcept && !selectedInspiration && !costPreference && selectedIngredients.size === 0)}
            size="lg"
            className="text-white px-6 py-3 rounded-full min-w-[160px] border-0"
            style={{ 
              backgroundColor: '#384048', 
              opacity: 1,
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2d3438';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#384048';
            }}
          >
            {isAiModifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Modifying Recipe...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Modify Recipe
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DesktopLayout;
