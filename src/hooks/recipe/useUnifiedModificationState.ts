import { useState } from "react";
import { PantryMode, PantryItem } from "@/types";
import { pantryService } from "@/services/pantry/pantryService";

export const useUnifiedModificationState = () => {
  // Form State (matching RecipeCreatePage pattern)
  const [userInput, setUserInput] = useState("");
  const [selectedQuickConcept, setSelectedQuickConcept] = useState("");
  const [dietaryConstraints, setDietaryConstraints] = useState<string[]>([]);
  const [timeConstraints, setTimeConstraints] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [costPreference, setCostPreference] = useState("");
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [spicinessLevel, setSpicinessLevel] = useState(3);
  const [targetServings, setTargetServings] = useState(4);
  const [selectedInspiration, setSelectedInspiration] = useState("");

  // Pantry State (matching RecipeCreatePage pattern)
  const [usePantry, setUsePantry] = useState(false);
  const [pantryMode, setPantryMode] = useState<PantryMode>('ignore');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedPantryItemIds, setSelectedPantryItemIds] = useState<Map<string, 'required' | 'optional'>>(new Map());

  // UI State
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);

  // Handler functions
  const handleUserInputChange = (input: string) => {
    setUserInput(input);
  };

  const handleQuickConceptSelect = (concept: string) => {
    setSelectedQuickConcept(concept);
  };

  const handleInspirationSelect = (inspiration: string) => {
    setSelectedInspiration(inspiration);
  };

  const handleDietaryChange = (constraints: string[]) => {
    setDietaryConstraints(constraints);
  };

  const handleTimeChange = (constraints: string[]) => {
    setTimeConstraints(constraints);
  };

  const handleSkillChange = (level: string) => {
    setSkillLevel(level === "" ? "intermediate" : level);
  };

  const handleCostChange = (preference: string) => {
    setCostPreference(preference);
  };

  const handleExclusionsChange = (ingredients: string[]) => {
    setExcludedIngredients(ingredients);
  };

  // Pantry handlers (matching RecipeCreatePage pattern)
  const handlePantryModeChange = (mode: PantryMode) => {
    setPantryMode(mode);
    if (mode === 'ignore') {
      setSelectedPantryItemIds(new Map());
    }
  };

  const handleSelectionChange = (selectedMap: Map<string, 'required' | 'optional'>) => {
    setSelectedPantryItemIds(selectedMap);
  };

  const handleUsePantryChange = (enabled: boolean) => {
    setUsePantry(enabled);
  };

  const loadPantryItems = async (userId: string, spaceId?: string) => {
    try {
      const items = await pantryService.getPantryItems(userId, spaceId);
      setPantryItems(items);
    } catch (error) {
      console.error('Failed to load pantry items:', error);
    }
  };

  const handleSpicinessChange = (level: number) => {
    setSpicinessLevel(level);
  };

  const handleServingsChange = (servings: number) => {
    setTargetServings(servings);
  };

  const handleTogglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  // Reset function for when switching recipes
  const resetState = () => {
    setUserInput("");
    setSelectedQuickConcept("");
    setDietaryConstraints([]);
    setTimeConstraints([]);
    setSkillLevel("intermediate");
    setCostPreference("");
    setExcludedIngredients([]);
    setSpicinessLevel(3);
    setTargetServings(4);
    setSelectedInspiration("");
    setIsPanelCollapsed(true);
    // Reset pantry state
    setUsePantry(false);
    setPantryMode('ignore');
    setSelectedPantryItemIds(new Map());
  };

  // Build AI request object
  const buildModificationRequest = (baseRecipe: any, selectedIngredients: Map<string, any>) => {
    return {
      baseRecipe,
      modificationInstructions: userInput || "Custom modification",
      selectedIngredients,
      dietaryConstraints,
      timeConstraints,
      skillLevel,
      costPreference,
      excludedIngredients,
      spicinessLevel,
      targetServings,
      cuisinePreference: selectedInspiration,
      concept: selectedQuickConcept || userInput,
      // Include pantry context for AI modifications
      pantryItems: usePantry ? pantryItems : undefined,
      pantryMode: usePantry ? pantryMode : 'ignore',
      selectedPantryItemIds: (usePantry && pantryMode === 'custom_selection') ? selectedPantryItemIds : undefined
    };
  };

  return {
    // State
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
    
    // Pantry State
    usePantry,
    pantryMode,
    pantryItems,
    selectedPantryItemIds,
    
    // Handlers
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
    
    // Pantry Handlers
    handlePantryModeChange,
    handleSelectionChange,
    handleUsePantryChange,
    loadPantryItems,
    
    resetState,
    buildModificationRequest
  };
};
