import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Recipe, Ingredient } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { aiRecipeGenerator, AIRecipeRequest, AIRecipeModificationRequest, AIRecipeResponse, AIRecipeError } from "@/services/ai/recipeGenerator";
import { foodUnitMapper } from "@/services/ai/foodUnitMapper";
import { recipeService } from "@/services/supabase/recipeService";
import { pantryService } from '@/services/pantry/pantryService';
import { PantryMode, PantryItem } from '@/types';
import UnifiedSidebar from "./UnifiedSidebar";
import IngredientItem from "../IngredientItem";
import UnifiedModificationPanel from "../UnifiedModificationPanel";
import RecipeImageGenerator from "../RecipeImageGenerator";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, Save, ChefHat, Wand2, Plus, Minus, RotateCcw, ChevronRight } from "lucide-react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import AILoadingProgress from "@/components/ui/AILoadingProgress";

const RecipeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { currentSpace, isLoading: spaceLoading } = useSpace();
  const { toast } = useToast();

  // UI State - Start with 2/3 width for better input space
  const [leftPanelSize, setLeftPanelSize] = useState(66);
  const [rightPanelSize, setRightPanelSize] = useState(34);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUserManuallyResized, setHasUserManuallyResized] = useState(false);

  // Ref for sidebar panel and button positioning
  const sidebarPanelRef = useRef<HTMLDivElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ left: 0 });

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
  }, [leftPanelSize, leftPanelCollapsed, isGenerating]);

  // Form State
  const [concept, setConcept] = useState("");
  const [selectedQuickConcept, setSelectedQuickConcept] = useState("");
  const [dietaryConstraints, setDietaryConstraints] = useState<string[]>([]);
  const [timeConstraints, setTimeConstraints] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [spicinessLevel, setSpicinessLevel] = useState(3); // Changed to number
  const [targetServings, setTargetServings] = useState(4);

  // New Unified Sidebar State
  const [userInput, setUserInput] = useState("");
  const [selectedInspiration, setSelectedInspiration] = useState("");

  // Workflow State
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [modificationError, setModificationError] = useState<AIRecipeError | null>(null);

  // Ingredient Selection State
  const [selectedIngredients, setSelectedIngredients] = useState<Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>>(new Map());

  // Quick Modification Selection State
  const [selectedQuickModifications, setSelectedQuickModifications] = useState<string[]>([]);

  // Version Management State
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isActiveVersionTemporary, setIsActiveVersionTemporary] = useState(false);
  const [generationError, setGenerationError] = useState<AIRecipeError | null>(null);

  // Loading State
  const [isSaving, setIsSaving] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<AIRecipeResponse | null>(null);

  // Dynamic sidebar sizing - transition to 1/3 when recipe is generated
  useEffect(() => {
    if (generatedRecipe && !hasUserManuallyResized) {
      // Recipe exists and user hasn't manually resized - transition to 1/3
      setLeftPanelSize(33);
      setRightPanelSize(67);
    } else if (!generatedRecipe && !hasUserManuallyResized) {
      // No recipe and user hasn't manually resized - reset to 2/3
      setLeftPanelSize(66);
      setRightPanelSize(34);
    }
  }, [generatedRecipe, hasUserManuallyResized]);

  // Serving Size Adjustment State
  const [originalServings, setOriginalServings] = useState<number>(4);
  const [currentServings, setCurrentServings] = useState<number>(4);

  // Image Generation State
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Pantry State
  const [usePantry, setUsePantry] = useState(false);
  const [pantryMode, setPantryMode] = useState<PantryMode>('ignore');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedPantryItemIds, setSelectedPantryItemIds] = useState<Map<string, 'required' | 'optional'>>(new Map());
  const [isLoadingPantry, setIsLoadingPantry] = useState(false);

  // Helper function to scale ingredient amounts
  const scaleIngredientAmount = (originalAmount: number, unitName: string): string => {
    if (currentServings === originalServings) {
      // Check if amount already includes unit to avoid duplication
      return originalAmount.toString().includes(unitName) 
        ? originalAmount.toString() 
        : `${originalAmount} ${unitName}`;
    }
    
    const scalingRatio = currentServings / originalServings;
    const scaledAmount = originalAmount * scalingRatio;
    
    // Format the scaled amount nicely
    const formattedAmount = scaledAmount === Math.round(scaledAmount) 
      ? Math.round(scaledAmount).toString() 
      : scaledAmount.toFixed(2).replace(/\.?0+$/, '');
    
    // Check if formatted amount should include unit
    return formattedAmount.includes(unitName) 
      ? formattedAmount 
      : `${formattedAmount} ${unitName}`;
  };

  // Helper function to adjust servings
  const adjustServings = (increment: number) => {
    const newServings = Math.max(1, currentServings + increment);
    setCurrentServings(newServings);
  };

  // Effects
  useEffect(() => {
    setLeftPanelSize(leftPanelCollapsed ? 4 : 35);
  }, [leftPanelCollapsed]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/sign-in");
    }
  }, [user, isLoading, navigate]);

  // Load pantry items when user or space changes
  const loadPantryItems = async () => {
    if (!user) return;
    
    setIsLoadingPantry(true);
    try {
      const items = await pantryService.getPantryItems(user.id, currentSpace?.id);
      setPantryItems(items);
    } catch (error) {
      console.error('Error loading pantry items:', error);
      // Don't show toast for pantry loading error to avoid disrupting recipe creation
    } finally {
      setIsLoadingPantry(false);
    }
  };

  // Handle pantry selection changes
  const handleSelectionChange = (selectedMap: Map<string, 'required' | 'optional'>) => {
    setSelectedPantryItemIds(selectedMap);
  };

  // Reset selections when pantry mode changes away from custom_selection
  const handlePantryModeChange = (mode: PantryMode) => {
    setPantryMode(mode);
    if (mode !== 'custom_selection') {
      setSelectedPantryItemIds(new Map());
    }
  };

  useEffect(() => {
    loadPantryItems();
  }, [user, currentSpace]);

  // Loading states
  if (isLoading || spaceLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Quick Modification Handlers
  const handleToggleQuickModification = (modification: string) => {
    setSelectedQuickModifications(prev => {
      if (prev.includes(modification)) {
        return prev.filter(mod => mod !== modification);
      } else {
        return [...prev, modification];
      }
    });
  };

  // Handler Functions
  const handleTogglePanel = () => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  };

  // Ingredient Selection Handlers
  const handleSelectIngredient = (ingredient: Ingredient, action: "increase" | "decrease" | "remove" | null) => {
    if (!action) {
      // Remove selection if no action specified
      setSelectedIngredients(prev => {
        const newMap = new Map(prev);
        newMap.delete(ingredient.id);
        return newMap;
      });
      return;
    }

    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      newMap.set(ingredient.id, { ingredient, action });
      return newMap;
    });
  };

  const removeIngredientSelection = (id: string) => {
    setSelectedIngredients(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const handleGenerateRecipe = async (directDescription?: string, directConcept?: string, directInspiration?: string) => {
    // Use direct parameters if provided, otherwise use state values
    const effectiveUserInput = directDescription || userInput;
    const effectiveQuickConcept = directConcept || selectedQuickConcept;
    const effectiveInspiration = directInspiration || selectedInspiration;

    // Build combined inputs for AI
    const combinedInputs = [effectiveUserInput, effectiveQuickConcept]
      .filter(Boolean)
      .join(' + ');

    if (!effectiveUserInput.trim() && !effectiveQuickConcept) {
      toast({
        title: "Missing Recipe Concept",
        description: "Please enter a recipe description or select a quick concept to get started.",
        variant: "destructive",
      });
      return;
    }

    // Validation for custom pantry selection mode
    if (usePantry && pantryMode === 'custom_selection' && selectedPantryItemIds.size === 0) {
      toast({
        title: "No Ingredients Selected",
        description: "Please select at least one ingredient from your pantry when using Custom Selection mode.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const request: AIRecipeRequest = {
        concept: combinedInputs,
        dietaryConstraints,
        timeConstraints,
        skillLevel,
        excludedIngredients: [],
        spicinessLevel,
        targetServings: targetServings || 4,
        cuisinePreference: effectiveInspiration || undefined,
        // Include pantry context only when enabled
        pantryItems: usePantry ? pantryItems : undefined,
        pantryMode: usePantry ? pantryMode : 'ignore',
        selectedPantryItemIds: (usePantry && pantryMode === 'custom_selection') ? selectedPantryItemIds : undefined
      };

      const response = await aiRecipeGenerator.generateRecipe(request);

      if ('type' in response) {
        setGenerationError(response);
        return;
      }

      setGeneratedRecipe(response);

      // Set original and current servings from generated recipe
      setOriginalServings(response.servings);
      setCurrentServings(response.servings);

      // Create original recipe version and switch to modify mode
      const originalVersion: RecipeVersion = {
        id: "original",
        name: "Original",
        recipe: {
          id: "generated",
          user_id: user?.id || "unknown",
          title: response.title,
          description: response.description,
          prep_time_minutes: response.prepTimeMinutes,
          cook_time_minutes: response.cookTimeMinutes,
          servings: response.servings,
          difficulty: response.difficulty,
          is_public: false,
          privacy_level: "private" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags: response.tags,
          ingredients: response.ingredients.map((ing, index) => ({
            id: `ing-${index}`,
            food_id: null,
            unit_id: null,
            food_name: ing.name.toLowerCase(),
            unit_name: ing.unit.toLowerCase(),
            amount: parseFloat(ing.amount) || 1,
          })),
          steps: response.steps.map((step, index) => ({
            id: `step-${index}`,
            recipe_id: "generated",
            order_number: index + 1,
            instruction: step,
          })),
          user: {
            id: user?.id || "unknown",
            email: user?.email || "",
            name: user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
            avatar_url: user?.user_metadata?.avatar_url,
          },
        },
        isActive: true,
        isTemporary: false,
      };
      
      setRecipeVersions([originalVersion]);
      setActiveVersionId("original");
      setIsActiveVersionTemporary(false);
      setIsModifyMode(true);
      
      // Clear all input and selection states for clean modification slate
      setUserInput("");
      setSelectedQuickConcept("");
      setSelectedInspiration("");
      setSelectedIngredients(new Map());
      setSelectedQuickModifications([]);
      setCustomInstructions("");

      toast({
        title: "Recipe Generated!",
        description: "Your recipe has been created successfully. You can now modify it or save it.",
        variant: "default",
      });

    } catch (error: any) {
      console.error('Generation error:', error);
      setGenerationError({
        type: 'service_error',
        message: 'Failed to generate recipe. Please try again.',
        suggestions: ['Check your internet connection', 'Try a different concept']
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const quickGenerateRecipe = async (description: string, concept: string) => {
    // Set only the text field, clear other selections
    setUserInput(description);
    setSelectedQuickConcept("");
    setSelectedInspiration("");
    
    // Call handleGenerateRecipe with direct parameters to avoid race condition
    await handleGenerateRecipe(description, "", "");
  };

  const handleModifyRecipe = async (modificationInstructions: string) => {
    if (!recipe) return;

    setIsGenerating(true);

    // Show modification toast
    toast({
      title: "Modifying Recipe...",
      description: "AI is modifying your recipe based on your selections and instructions. This may take a moment.",
      variant: "default",
    });

    try {
      const modificationRequest: AIRecipeModificationRequest = {
        baseRecipe: recipe,
        modificationInstructions,
      };

      const response = await aiRecipeGenerator.modifyRecipe(modificationRequest);

      if ('type' in response) {
        throw new Error(response.message);
      }

      setGeneratedRecipe(response);
      
      // Create new version for the modification
      const newVersion: RecipeVersion = {
        id: `temp-${Date.now()}`,
        name: `Modification ${recipeVersions.length + 1}`,
        recipe: {
          ...recipe,
          title: response.title,
          description: response.description,
          ingredients: response.ingredients.map((ing, index) => ({
            id: `ing-${index}`,
            food_id: null,
            unit_id: null,
            food_name: ing.name.toLowerCase(),
            unit_name: ing.unit.toLowerCase(),
            amount: parseFloat(ing.amount) || 1,
          })),
          steps: response.steps.map((step, index) => ({
            id: `step-${index}`,
            recipe_id: "generated",
            order_number: index + 1,
            instruction: step,
          })),
        },
        isActive: true,
        isTemporary: true,
      };
      
      setRecipeVersions(prev => [...prev, newVersion]);
      setActiveVersionId(newVersion.id);
      setIsActiveVersionTemporary(true);

      toast({
        title: "Recipe Modified!",
        description: "Your recipe has been updated. You can continue modifying or save it.",
      });

      // Clear all input and selection states after successful modification
      setUserInput("");
      setSelectedQuickConcept("");
      setSelectedInspiration("");
      setSelectedIngredients(new Map());
      setSelectedQuickModifications([]);
      setCustomInstructions("");

    } catch (error) {
      console.error('Modification error:', error);
      setModificationError({
        type: 'service_error',
        message: 'Failed to modify recipe. Please try again.',
        suggestions: ['Check your internet connection', 'Try different instructions']
      });
      toast({
        title: "Modification Failed",
        description: error instanceof Error ? error.message : "Failed to modify recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      
      // Show completion toast
      toast({
        title: "Recipe Modified!",
        description: "Your recipe has been updated successfully. You can continue modifying or save it.",
        variant: "default",
      });
    }
  };

  const handleApplyModifications = () => {
    // Check if we have any type of modification to apply
    const hasIngredientSelections = selectedIngredients.size > 0;
    const hasCustomInstructions = customInstructions.trim().length > 0;
    const hasQuickModifications = selectedQuickModifications.length > 0;
    const hasUserInput = userInput.trim().length > 0;
    const hasQuickConcept = selectedQuickConcept.length > 0;
    const hasInspiration = selectedInspiration.length > 0;
    
    if (!hasIngredientSelections && !hasCustomInstructions && !hasQuickModifications && !hasUserInput && !hasQuickConcept && !hasInspiration) {
      toast({
        title: "No Modifications",
        description: "Please select ingredient modifications, enter custom instructions, choose quick modifications, or any combination of these.",
        variant: "destructive"
      });
      return;
    }
    
    // Build modification instructions from all sources
    let modificationInstructions = "";
    
    // Add user input
    if (hasUserInput) {
      modificationInstructions = userInput.trim();
    }
    
    // Add quick concepts/modifications
    if (hasQuickConcept) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += selectedQuickConcept;
    }
    
    // Add inspiration
    if (hasInspiration) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += selectedInspiration;
    }
    
    // Add quick modifications
    if (hasQuickModifications) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += "Quick modifications: " + selectedQuickModifications.join(", ");
    }
    
    // Add ingredient selections to instructions
    if (hasIngredientSelections) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      const ingredientMods = Array.from(selectedIngredients.values()).map(
        selection => {
          const ingredient = selection.ingredient;
          const action = selection.action;
          switch (action) {
            case "increase":
              return `Increase the amount of ${ingredient.food_name}`;
            case "decrease":
              return `Decrease the amount of ${ingredient.food_name}`;
            case "remove":
              return `Remove ${ingredient.food_name}`;
            default:
              return "";
          }
        }
      ).filter(Boolean).join(", ");
      
      modificationInstructions += "Ingredient modifications: " + ingredientMods;
    }
    
    // Add custom instructions
    if (hasCustomInstructions) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += customInstructions.trim();
    }
    
    // Call the modify function with combined instructions
    handleModifyRecipe(modificationInstructions);
  };

  const handleResetToCreate = () => {
    setIsModifyMode(false);
    setGeneratedRecipe(null);
    setCustomInstructions("");
  };

  const handleSaveRecipe = async () => {
    if (!generatedRecipe || !user || !currentSpace) return;

    setIsSaving(true);

    try {
      const ingredients = await Promise.all(
        generatedRecipe.ingredients.map(async (ing) => {
          const foodResult = await foodUnitMapper.findOrCreateFood(ing.name, currentSpace.id);
          const unitResult = await foodUnitMapper.findOrCreateUnit(ing.unit);
          
          return {
            food_id: foodResult.food_id || null,
            food_name: foodResult.food_name,
            unit_id: unitResult.unit_id || null,
            unit_name: unitResult.unit_name,
            amount: parseFloat(ing.amount) || 1,
          };
        })
      );

      const recipeData = {
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        image_url: generatedImageUrl || null,
        prep_time_minutes: generatedRecipe.prepTimeMinutes,
        cook_time_minutes: generatedRecipe.cookTimeMinutes,
        servings: generatedRecipe.servings,
        difficulty: generatedRecipe.difficulty,
        is_public: false,
        privacy_level: "private" as const,
        tags: generatedRecipe.tags,
        ingredients,
        steps: generatedRecipe.steps.map((step, index) => ({
          order_number: index + 1,
          instruction: step,
        })),
        user_id: user.id,
        space_id: currentSpace.id,
      };

      const savedRecipe = await recipeService.createRecipe(recipeData);

      // Mark the current active version as saved
      setRecipeVersions(prev => 
        prev.map(version => 
          version.id === activeVersionId 
            ? { ...version, isSaved: true, savedRecipeId: savedRecipe.id }
            : version
        )
      );

      toast({
        title: "Recipe saved to Collection!",
        description: `"${savedRecipe.title}" has been added to your Collection. You can continue modifying or view it in your Collections.`,
      });

      // Don't navigate away - preserve temporary versions

    } catch (error: any) {
      console.error('Error saving recipe:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Recipe transformation for display
  const recipe = generatedRecipe ? {
    id: "generated",
    user_id: user.id,
    title: generatedRecipe.title,
    description: generatedRecipe.description,
    prep_time_minutes: generatedRecipe.prepTimeMinutes,
    cook_time_minutes: generatedRecipe.cookTimeMinutes,
    servings: generatedRecipe.servings,
    difficulty: generatedRecipe.difficulty,
    is_public: false,
    privacy_level: "private" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: generatedRecipe.tags,
    ingredients: generatedRecipe.ingredients.map((ing, index) => ({
      id: `ing-${index}`,
      food_id: null,
      unit_id: null,
      food_name: ing.name.toLowerCase(),
      unit_name: ing.unit.toLowerCase(),
      amount: parseFloat(ing.amount) || 1,
    })),
    steps: generatedRecipe.steps.map((step, index) => ({
      id: `step-${index}`,
      recipe_id: "generated",
      order_number: index + 1,
      instruction: step,
    })),
    user: {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      avatar_url: user.user_metadata?.avatar_url,
    },
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Consistent Navbar */}
      <Navbar />

      {/* Main Content with padding for fixed navbar */}
      <div className="pt-16">
        <div className="container mx-auto py-2 px-3">
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-100px)] rounded-lg border relative">
          <ResizablePanel 
            defaultSize={66}
            size={leftPanelSize}
            minSize={8}
            maxSize={100}
            collapsible
            collapsedSize={8}
            onCollapse={() => setLeftPanelCollapsed(true)}
            onExpand={() => setLeftPanelCollapsed(false)}
            onResize={(size) => {
              setLeftPanelSize(size);
              // Track if user has manually resized (with tolerance for floating-point precision)
              if (Math.abs(size - 66) > 2 && Math.abs(size - 33) > 2) {
                setHasUserManuallyResized(true);
              }
            }}
            className={`relative transition-all duration-300 ${
              leftPanelCollapsed ? "w-15" : "w-full"
            } ${leftPanelCollapsed ? "bg-sage-500 text-white" : "bg-sage-500 text-white shadow-lg"}`}
          >
            {/* Collapsed state indicator - positioned absolutely over sidebar */}
            {(leftPanelCollapsed || leftPanelSize < 15) && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-sage-500 pointer-events-none">
                <div className="text-white text-center">
                  <div className="[writing-mode:vertical-lr] text-sm font-medium mb-2">
                    {isModifyMode ? 'Modify' : 'Create'} recipe
                  </div>
                  <ChevronRight className="h-4 w-4 mx-auto animate-pulse" />
                </div>
              </div>
            )}
            
            {/* UnifiedSidebar - only render when not collapsed/small */}
            {!(leftPanelCollapsed || leftPanelSize < 15) && (
              <UnifiedSidebar
                ref={sidebarPanelRef}
                mode={isModifyMode ? 'modify' : 'create'}
                recipe={recipe}
                isPanelCollapsed={leftPanelCollapsed}
                onTogglePanel={handleTogglePanel}
                
                // User input
                userInput={userInput}
                onUserInputChange={setUserInput}
                
                // Quick concepts/modifications
                selectedQuickConcept={selectedQuickConcept}
                onQuickConceptSelect={setSelectedQuickConcept}
                
                // Inspiration
                selectedInspiration={selectedInspiration}
                onInspirationSelect={setSelectedInspiration}
                
                // Advanced options
                dietaryConstraints={dietaryConstraints}
                timeConstraints={timeConstraints}
                skillLevel={skillLevel}
                excludedIngredients={excludedIngredients}
                spicinessLevel={spicinessLevel}
                targetServings={targetServings}
                onServingsChange={setTargetServings}
                onDietaryChange={setDietaryConstraints}
                onTimeChange={setTimeConstraints}
                onSkillChange={setSkillLevel}
                onExclusionsChange={setExcludedIngredients}
                onSpicinessChange={setSpicinessLevel}
                
                // Pantry settings
                usePantry={usePantry}
                pantryMode={pantryMode}
                pantryItems={pantryItems}
                selectedPantryItemIds={selectedPantryItemIds}
                onUsePantryChange={setUsePantry}
                onPantryModeChange={handlePantryModeChange}
                onSelectionChange={handleSelectionChange}
                
                // Ingredient modifications (modify mode only)
                selectedIngredients={selectedIngredients}
                onRemoveIngredientSelection={removeIngredientSelection}
                
                // Loading states
                isGenerating={isGenerating}
                isSaving={isSaving}
              />
            )}
          </ResizablePanel>

          <ResizableHandle className="relative">
            {/* Drag indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center justify-center bg-slate-100 rounded-full p-1 shadow-sm border">
                <div className="flex flex-col gap-0.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </ResizableHandle>

          <ResizablePanel defaultSize={34} size={rightPanelSize} className="bg-white overflow-y-auto">
            <div className="p-4">
              {/* Simple Version Management Tabs */}
              {isModifyMode && recipeVersions.length > 0 && (
                <div className="mb-4 border-b">
                  <div className="flex space-x-1">
                    {recipeVersions.map((version) => (
                      <button
                        key={version.id}
                        onClick={() => {
                          setActiveVersionId(version.id);
                          // Switch to the version's recipe
                          setGeneratedRecipe({
                            title: version.recipe.title,
                            description: version.recipe.description || "",
                            prepTimeMinutes: version.recipe.prep_time_minutes || 15,
                            cookTimeMinutes: version.recipe.cook_time_minutes || 30,
                            servings: version.recipe.servings || 4,
                            difficulty: version.recipe.difficulty || "medium",
                            tags: version.recipe.tags || [],
                            ingredients: version.recipe.ingredients.map(ing => ({
                              name: ing.food_name,
                              unit: ing.unit_name,
                              amount: ing.amount.toString()
                            })),
                            steps: version.recipe.steps.map(step => step.instruction)
                          });
                        }}
                        className={`px-3 py-2 text-sm font-medium border-b-2 rounded-t-md whitespace-nowrap ${
                          activeVersionId === version.id
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                        }`}
                      >
                        {version.name}
                        {version.isTemporary && (
                          <span className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200 px-1 rounded">
                            Temporary
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <AILoadingProgress 
                    isLoading={isGenerating}
                    message={isModifyMode ? "Modifying Your Recipe..." : "Creating Your Recipe..."}
                    large={true}
                  />
                </div>
              ) : recipe ? (
                <>
                  {/* Recipe Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
                      <Button
                        onClick={handleSaveRecipe}
                        disabled={isSaving}
                        className="bg-sage-600 hover:bg-sage-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="text-sage-400 mr-2 h-4 w-4" />
                            Save Recipe
                          </>
                        )}
                      </Button>
                    </div>
                    {recipe.description && (
                      <p className="text-gray-600 mt-2">{recipe.description}</p>
                    )}
                    
                    {/* Recipe Metadata */}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                      {recipe.prep_time_minutes && (
                        <div>
                          <span className="font-medium">Prep:</span> {recipe.prep_time_minutes} min
                        </div>
                      )}
                      {recipe.cook_time_minutes && (
                        <div>
                          <span className="font-medium">Cook:</span> {recipe.cook_time_minutes} min
                        </div>
                      )}
                      {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                        <div>
                          <span className="font-medium">Total:</span> {((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0))} min
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Servings:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustServings(-1)}
                              className="h-6 w-6 p-0"
                              disabled={currentServings <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-2 py-1 text-sm font-medium">
                              {currentServings}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustServings(1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            {currentServings !== originalServings && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentServings(originalServings)}
                                className="h-6 w-6 p-0 ml-1"
                                title="Reset to original servings"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {currentServings !== originalServings && (
                            <span className="text-xs text-gray-400">
                              (scaled from {originalServings})
                            </span>
                          )}
                        </div>
                      )}
                      {recipe.difficulty && (
                        <div>
                          <span className="font-medium">Difficulty:</span> {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recipe Image Generator */}
                  {recipe && (
                    <RecipeImageGenerator
                      recipe={recipe}
                      onImageGenerated={setGeneratedImageUrl}
                      currentImageUrl={generatedImageUrl}
                    />
                  )}

                  {/* Recipe Content */}
                  <div className="space-y-6">
                    {/* Ingredients Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                      <div className="space-y-2">
                        {recipe.ingredients.map((ingredient, index) => {
                          const selectedIngredient = selectedIngredients.get(ingredient.id);
                          const scaledAmount = scaleIngredientAmount(ingredient.amount, ingredient.unit_name);
                          return (
                            <IngredientItem
                              key={index}
                              ingredient={ingredient}
                              isSelected={!!selectedIngredient}
                              selectedAction={selectedIngredient?.action}
                              onSelectIngredient={handleSelectIngredient}
                              scaledAmount={scaledAmount}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Steps Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
                      <ol className="space-y-3">
                        {recipe.steps.map((step, index) => (
                          <li key={index} className="flex text-gray-700">
                            <span className="flex-shrink-0 w-6 h-6 bg-sage-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                              {index + 1}
                            </span>
                            <span>{step.instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <ChefHat className="h-16 w-16 mb-6 text-sage-500" />
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Create Something Delicious?</h2>
                    <p className="text-gray-600">Try one of these ideas or describe your own recipe</p>
                  </div>
                  
                  {/* Clickable Inspiration Examples */}
                  <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                    <button
                      onClick={() => quickGenerateRecipe(
                        "Spicy Thai basil chicken with jasmine rice and fresh vegetables",
                        "Quick Pasta Dish"
                      )}
                      disabled={isGenerating}
                      className="px-4 py-3 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🌶️ Spicy Thai Basil Chicken
                    </button>
                    <button
                      onClick={() => quickGenerateRecipe(
                        "Creamy vegan chocolate mousse with avocado and dark chocolate",
                        "Quick Pasta Dish"
                      )}
                      disabled={isGenerating}
                      className="px-4 py-3 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🍫 Vegan Chocolate Mousse
                    </button>
                    <button
                      onClick={() => quickGenerateRecipe(
                        "Mediterranean quinoa bowl with roasted vegetables and lemon tahini dressing",
                        "Healthy Salad"
                      )}
                      disabled={isGenerating}
                      className="px-4 py-3 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🥗 Mediterranean Quinoa Bowl
                    </button>
                    <button
                      onClick={() => quickGenerateRecipe(
                        "Classic Italian carbonara with crispy pancetta and pecorino cheese",
                        "Quick Pasta Dish"
                      )}
                      disabled={isGenerating}
                      className="px-4 py-3 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🍝 Authentic Carbonara
                    </button>
                    <button
                      onClick={() => quickGenerateRecipe(
                        "Japanese chicken teriyaki bowl with steamed rice and pickled vegetables",
                        "Quick Pasta Dish"
                      )}
                      disabled={isGenerating}
                      className="px-4 py-3 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🍱 Chicken Teriyaki Bowl
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Floating Action Button - Dynamic positioning over sidebar */}
        <div className="fixed bottom-6 z-50" style={{ left: `${buttonPosition.left}px` }}>
          <Button
            onClick={isModifyMode ? handleApplyModifications : () => handleGenerateRecipe()}
            disabled={isGenerating || (
              isModifyMode 
                ? (!userInput.trim() && !selectedQuickConcept && !selectedInspiration && selectedIngredients.size === 0)
                : (!userInput.trim() && !selectedQuickConcept && !selectedInspiration)
            )}
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
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isModifyMode ? 'Modifying...' : 'Creating...'}
              </>
            ) : (
              <>
                <Wand2 className="text-sage-400 mr-2 h-4 w-4" />
                {isModifyMode ? 'Modify Recipe' : 'Generate Recipe'}
              </>
            )}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCreatePage;
