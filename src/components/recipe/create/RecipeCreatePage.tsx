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
import UnifiedSidebar from "./UnifiedSidebar";
import IngredientItem from "../IngredientItem";
import UnifiedModificationPanel from "../UnifiedModificationPanel";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, Save, ChefHat, Wand2 } from "lucide-react";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import AILoadingProgress from "@/components/ui/AILoadingProgress";

const RecipeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { currentSpace, isLoading: spaceLoading } = useSpace();
  const { toast } = useToast();

  // UI State
  const [leftPanelSize, setLeftPanelSize] = useState(35);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false); // Start open, not collapsed

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
  }, [leftPanelSize, leftPanelCollapsed]);

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<AIRecipeResponse | null>(null);

  // Effects
  useEffect(() => {
    setLeftPanelSize(leftPanelCollapsed ? 4 : 35);
  }, [leftPanelCollapsed]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/sign-in");
    }
  }, [user, isLoading, navigate]);

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
    
    // Combine all inputs for the recipe concept
    const combinedInputs = [effectiveUserInput.trim(), effectiveQuickConcept, effectiveInspiration].filter(Boolean).join('. ');
    
    if (!combinedInputs) {
      toast({
        title: "Input Required",
        description: "Please describe what you'd like to make or select a concept.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationError(null);

      const request: AIRecipeRequest = {
        concept: combinedInputs,
        dietaryConstraints,
        timeConstraints,
        skillLevel,
        excludedIngredients: [],
        spicinessLevel,
        targetServings: targetServings || 4,
        cuisinePreference: effectiveInspiration || undefined,
      };

      const response = await aiRecipeGenerator.generateRecipe(request);

      if ('type' in response) {
        setGenerationError(response);
        return;
      }

      setGeneratedRecipe(response);

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
            defaultSize={35}
            size={leftPanelSize}
            minSize={leftPanelCollapsed ? 4 : 35}
            maxSize={leftPanelCollapsed ? 4 : 60}
            collapsible
            collapsedSize={4}
            onCollapse={() => setLeftPanelCollapsed(true)}
            onExpand={() => setLeftPanelCollapsed(false)}
            className={`relative transition-all duration-300 ${
              leftPanelCollapsed ? "w-15" : "w-full"
            } ${leftPanelCollapsed ? "bg-sage-500 text-white" : "bg-sage-500 text-white shadow-lg"}`}
          >
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
              onDietaryChange={setDietaryConstraints}
              onTimeChange={setTimeConstraints}
              onSkillChange={setSkillLevel}
              onExclusionsChange={setExcludedIngredients}
              onSpicinessChange={setSpicinessLevel}
              onServingsChange={setTargetServings}
              
              // Ingredient modifications (modify mode only)
              selectedIngredients={selectedIngredients}
              onRemoveIngredientSelection={removeIngredientSelection}
              
              // Loading states
              isGenerating={isGenerating}
              isSaving={isSaving}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={65} className="bg-white overflow-y-auto">
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
                  <Loader2 className="h-16 w-16 mb-6 text-sage-500 animate-spin" />
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Recipe...</h2>
                    <p className="text-gray-600">Our AI is crafting something delicious just for you</p>
                  </div>
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
                  </div>

                  {/* Recipe Content */}
                  <div className="space-y-6">
                    {/* Ingredients Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                      <div className="space-y-2">
                        {recipe.ingredients.map((ingredient, index) => {
                          const selectedIngredient = selectedIngredients.get(ingredient.id);
                          return (
                            <IngredientItem
                              key={index}
                              ingredient={ingredient}
                              isSelected={!!selectedIngredient}
                              selectedAction={selectedIngredient?.action}
                              onSelectIngredient={handleSelectIngredient}
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
