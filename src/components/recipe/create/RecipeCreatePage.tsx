import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Recipe, Ingredient } from "@/types";
import { RecipeVersion } from "@/context/recipe/types";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { aiRecipeGenerator, AIRecipeRequest, AIRecipeModificationRequest, AIRecipeResponse, AIRecipeError } from "@/services/ai/recipeGenerator";
import { foodUnitMapper } from "@/services/ai/foodUnitMapper";
import { recipeService } from "@/services/supabase/recipeService";
import CreateSidebar from "./CreateSidebar";
import ModificationSidebar from "../ModificationSidebar";
import IngredientItem from "../IngredientItem";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2, Save, ChefHat } from "lucide-react";
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

  // Form State
  const [concept, setConcept] = useState("");
  const [selectedQuickConcept, setSelectedQuickConcept] = useState("");
  const [dietaryConstraints, setDietaryConstraints] = useState<string[]>([]);
  const [timeConstraints, setTimeConstraints] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [spicinessLevel, setSpicinessLevel] = useState("medium");
  const [targetServings, setTargetServings] = useState(4);

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

  const handleGenerateRecipe = async () => {
    if (!concept.trim()) {
      toast({
        title: "Concept Required",
        description: "Please enter a recipe concept to generate.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    // Show generation toast
    toast({
      title: "Generating Recipe...",
      description: "AI is creating your recipe based on your requirements. This may take a moment.",
      variant: "default",
    });

    try {
      const request: AIRecipeRequest = {
        concept,
        dietaryConstraints,
        timeConstraints,
        skillLevel,
        excludedIngredients,
        spicinessLevel: parseInt(spicinessLevel) || 0,
        targetServings: parseInt(targetServings.toString()) || 4,
      };

      const response = await aiRecipeGenerator.generateRecipe(request);

      if ('type' in response) {
        setGenerationError(response);
        return;
      }

      setGeneratedRecipe(response);

      toast({
        title: "Recipe Generated!",
        description: "Your recipe has been created. You can now modify it using the controls on the left.",
      });

      // Create original recipe version and switch to modify mode
      const originalVersion: RecipeVersion = {
        id: "original",
        name: "Original",
        recipe: JSON.parse(JSON.stringify(recipe)), // Deep copy to prevent mutation
        isActive: true,
        isTemporary: false,
      };
      
      setRecipeVersions([originalVersion]);
      setActiveVersionId("original");
      setIsActiveVersionTemporary(false);
      setIsModifyMode(true);

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError({
        type: 'service_error',
        message: 'Failed to generate recipe. Please try again.',
        suggestions: ['Check your internet connection', 'Try a different concept']
      });
    } finally {
      setIsGenerating(false);
      
      // Show completion toast
      toast({
        title: "Recipe Generated!",
        description: "Your recipe has been created successfully. You can now modify it or save it.",
        variant: "default",
      });
    }
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
    
    if (!hasIngredientSelections && !hasCustomInstructions && !hasQuickModifications) {
      toast({
        title: "No Modifications",
        description: "Please select ingredient modifications, enter custom instructions, choose quick modifications, or any combination of these.",
        variant: "destructive"
      });
      return;
    }
    
    // Build modification instructions from all sources
    let modificationInstructions = "";
    
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
              return `Remove ${ingredient.food_name} from the recipe`;
            default:
              return "";
          }
        }
      ).filter(mod => mod.length > 0);
      
      if (ingredientMods.length > 0) {
        modificationInstructions += "Ingredient modifications: " + ingredientMods.join(", ");
      }
    }
    
    // Add custom instructions
    if (hasCustomInstructions) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += customInstructions.trim();
    }
    
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
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-100px)] rounded-lg border">
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
            {/* Conditional Sidebar */}
            {!isModifyMode ? (
              <CreateSidebar
                concept={concept}
                selectedQuickConcept={selectedQuickConcept}
                dietaryConstraints={dietaryConstraints}
                timeConstraints={timeConstraints}
                skillLevel={skillLevel}
                excludedIngredients={excludedIngredients}
                spicinessLevel={parseInt(spicinessLevel) || 0}
                targetServings={parseInt(targetServings.toString()) || 4}
                onConceptChange={setConcept}
                onQuickConceptSelect={setSelectedQuickConcept}
                onDietaryChange={setDietaryConstraints}
                onTimeChange={setTimeConstraints}
                onSkillChange={setSkillLevel}
                onExclusionsChange={setExcludedIngredients}
                onSpicinessChange={(level: number) => setSpicinessLevel(level.toString())}
                onServingsChange={setTargetServings}
                onGenerateRecipe={handleGenerateRecipe}
                isGenerating={isGenerating}
                isSaving={isSaving}
                onSaveRecipe={handleSaveRecipe}
                onTogglePanel={handleTogglePanel}
                isPanelCollapsed={leftPanelCollapsed}
              />
            ) : (
              <ModificationSidebar
                recipe={recipe}
                selectedIngredients={selectedIngredients}
                onRemoveIngredientSelection={removeIngredientSelection}
                customInstructions={customInstructions}
                onCustomInstructionsChange={setCustomInstructions}
                onStartModification={() => handleApplyModifications()}
                onSelectModificationType={handleToggleQuickModification}
                selectedQuickModifications={selectedQuickModifications}
                onApplyModifications={handleApplyModifications}
                isModified={false}
                resetToOriginal={handleResetToCreate}
                isDisabled={isGenerating}
                isSaving={isSaving}
                isActiveVersionTemporary={isActiveVersionTemporary}
                onTogglePanel={handleTogglePanel}
                selectedModifications={selectedQuickModifications}
              />
            )}
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
              
              {recipe ? (
                <>
                  {/* Recipe Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
                      <Button
                        onClick={handleSaveRecipe}
                        disabled={isSaving}
                        className="bg-sage-600 hover:bg-sage-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
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
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <ChefHat className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No recipe generated yet</p>
                  <p className="text-sm">Use the controls on the left to create a new recipe with AI</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

export default RecipeCreatePage;
