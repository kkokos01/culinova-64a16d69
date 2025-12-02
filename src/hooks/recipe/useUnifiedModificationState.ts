import { useState } from "react";

export const useUnifiedModificationState = () => {
  // Form State (matching RecipeCreatePage pattern)
  const [userInput, setUserInput] = useState("");
  const [selectedQuickConcept, setSelectedQuickConcept] = useState("");
  const [dietaryConstraints, setDietaryConstraints] = useState<string[]>([]);
  const [timeConstraints, setTimeConstraints] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [spicinessLevel, setSpicinessLevel] = useState(3);
  const [targetServings, setTargetServings] = useState(4);
  const [selectedInspiration, setSelectedInspiration] = useState("");

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

  const handleExclusionsChange = (ingredients: string[]) => {
    setExcludedIngredients(ingredients);
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
    setExcludedIngredients([]);
    setSpicinessLevel(3);
    setTargetServings(4);
    setSelectedInspiration("");
    setIsPanelCollapsed(true);
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
      excludedIngredients,
      spicinessLevel,
      targetServings,
      cuisinePreference: selectedInspiration,
      concept: selectedQuickConcept || userInput
    };
  };

  return {
    // State
    userInput,
    selectedQuickConcept,
    dietaryConstraints,
    timeConstraints,
    skillLevel,
    excludedIngredients,
    spicinessLevel,
    targetServings,
    selectedInspiration,
    isPanelCollapsed,
    
    // Handlers
    handleUserInputChange,
    handleQuickConceptSelect,
    handleInspirationSelect,
    handleDietaryChange,
    handleTimeChange,
    handleSkillChange,
    handleExclusionsChange,
    handleSpicinessChange,
    handleServingsChange,
    handleTogglePanel,
    resetState,
    buildModificationRequest
  };
};
