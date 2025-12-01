import React, { useState } from "react";
import { Recipe, Ingredient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronDown, ChevronUp, Wand2, Lightbulb, Settings, Loader2 } from "lucide-react";
import AILoadingProgress from "@/components/ui/AILoadingProgress";

interface UnifiedSidebarProps {
  mode: 'create' | 'modify';
  recipe?: Recipe; // Only for modify mode
  isPanelCollapsed: boolean;
  onTogglePanel: () => void;
  
  // User input
  userInput: string;
  onUserInputChange: (input: string) => void;
  
  // Quick concepts/modifications
  selectedQuickConcept: string;
  onQuickConceptSelect: (concept: string) => void;
  
  // Inspiration
  selectedInspiration: string;
  onInspirationSelect: (inspiration: string) => void;
  
  // Advanced options
  dietaryConstraints: string[];
  timeConstraints: string[];
  skillLevel: string;
  excludedIngredients: string[];
  spicinessLevel: number;
  targetServings: number;
  onDietaryChange: (constraints: string[]) => void;
  onTimeChange: (constraints: string[]) => void;
  onSkillChange: (level: string) => void;
  onExclusionsChange: (ingredients: string[]) => void;
  onSpicinessChange: (level: number) => void;
  onServingsChange: (servings: number) => void;
  
  // Ingredient modifications (modify mode only)
  selectedIngredients?: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection?: (id: string) => void;
  
  // Loading states
  isGenerating: boolean;
  isSaving: boolean;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  mode,
  recipe,
  isPanelCollapsed,
  onTogglePanel,
  userInput,
  onUserInputChange,
  selectedQuickConcept,
  onQuickConceptSelect,
  selectedInspiration,
  onInspirationSelect,
  dietaryConstraints,
  timeConstraints,
  skillLevel,
  excludedIngredients,
  spicinessLevel,
  targetServings,
  onDietaryChange,
  onTimeChange,
  onSkillChange,
  onExclusionsChange,
  onSpicinessChange,
  onServingsChange,
  selectedIngredients,
  onRemoveIngredientSelection,
  isGenerating,
  isSaving
}) => {
  const [isQuickConceptsOpen, setIsQuickConceptsOpen] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Mode-specific content
  const isCreateMode = mode === 'create';
  
  const quickConcepts = isCreateMode ? [
    'Quick Pasta Dish',
    'Healthy Salad',
    'Comfort Soup',
    'Grilled Chicken',
    'Vegetarian Stir-fry',
    'Breakfast Bowl'
  ] : [
    'Healthier',
    'Simpler', 
    'Spicier',
    'Quicker',
    'Gluten-Free',
    'Keto-Friendly'
  ];

  const inspirations = isCreateMode ? [
    'Italian Cuisine',
    'Asian Fusion',
    'Comfort Food',
    'Mediterranean',
    'Mexican Flavors',
    'French Classic'
  ] : [
    'Reduce Calories',
    'Add Vegetables',
    'Make Gluten-Free',
    'Reduce Sodium',
    'Add Protein',
    'Make Dairy-Free'
  ];

  const dietaryOptions = [
    'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 
    'low-sodium', 'keto', 'high-protein', 'low-carb'
  ];

  const timeOptions = [
    'under-15', 'under-30', 'one-pot', '5-ingredients', 'no-cook'
  ];

  const skillLevels = ['beginner', 'intermediate', 'advanced'];

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
          <span>{isCreateMode ? 'Recipe Creation' : 'Recipe Modification'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Scrollable Content */}
      <div className="overflow-y-auto h-full">
        <Card className="rounded-none border-x-0 border-t-0 border-b border-white/20 shadow-none">
          <CardHeader className="p-3 flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-sage-600">
              {isCreateMode ? 'Create Recipe' : 'Modify Recipe'}
            </h2>
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
        
        <div className="p-4 space-y-4">
          <p className="text-black text-sm">
            {isCreateMode 
              ? 'Create a new recipe with AI assistance' 
              : 'Customize this recipe with AI assistance'
            }
          </p>
          
          {/* 1. User Input Section (Always Open) */}
          <div className="space-y-2">
            <Label htmlFor="user-input" className="text-base font-medium text-gray-900">
              {isCreateMode ? 'What do you want to make?' : 'How do you want to modify this recipe?'}
            </Label>
            <Input
              id="user-input"
              value={userInput}
              onChange={(e) => onUserInputChange(e.target.value)}
              placeholder={isCreateMode 
                ? 'Describe your recipe idea...' 
                : 'Describe your modifications...'
              }
              className="w-full"
            />
          </div>

          {/* 2. Quick Concepts Section (Collapsible, Open by Default) */}
          <Collapsible open={isQuickConceptsOpen} onOpenChange={setIsQuickConceptsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-4 w-4" />
                  <span className="font-medium">Quick {isCreateMode ? 'Concepts' : 'Modifications'}</span>
                </div>
                {isQuickConceptsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              {/* Main Quick Concepts */}
              <div className="grid grid-cols-1 gap-2">
                {quickConcepts.map((concept) => (
                  <Button
                    key={concept}
                    variant={selectedQuickConcept === concept ? "default" : "secondary"}
                    size="sm"
                    onClick={() => onQuickConceptSelect(selectedQuickConcept === concept ? '' : concept)}
                    className="justify-start text-left h-8"
                  >
                    {concept}
                  </Button>
                ))}
              </div>
              
              {/* Need Inspiration Subsection */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Lightbulb className="h-3 w-3" />
                  <span>Need Inspiration?</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {inspirations.map((inspiration) => (
                    <Button
                      key={inspiration}
                      variant={selectedInspiration === inspiration ? "default" : "secondary"}
                      size="sm"
                      onClick={() => onInspirationSelect(selectedInspiration === inspiration ? '' : inspiration)}
                      className="justify-start text-left h-7 text-xs"
                    >
                      {inspiration}
                    </Button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 3. Advanced Options Section (Collapsible, Closed by Default) */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Advanced Options</span>
                </div>
                {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              {/* Dietary Constraints */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Dietary Constraints</Label>
                <div className="flex flex-wrap gap-1">
                  {dietaryOptions.map((option) => (
                    <Badge
                      key={option}
                      variant={dietaryConstraints.includes(option) ? "default" : "secondary"}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const updated = dietaryConstraints.includes(option)
                          ? dietaryConstraints.filter(d => d !== option)
                          : [...dietaryConstraints, option];
                        onDietaryChange(updated);
                      }}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Time Constraints */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Time Constraints</Label>
                <div className="flex flex-wrap gap-1">
                  {timeOptions.map((option) => (
                    <Badge
                      key={option}
                      variant={timeConstraints.includes(option) ? "default" : "secondary"}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        const updated = timeConstraints.includes(option)
                          ? timeConstraints.filter(t => t !== option)
                          : [...timeConstraints, option];
                        onTimeChange(updated);
                      }}
                    >
                      {option.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skill Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Skill Level</Label>
                <div className="flex gap-1">
                  {skillLevels.map((level) => (
                    <Badge
                      key={level}
                      variant={skillLevel === level ? "default" : "secondary"}
                      className="cursor-pointer text-xs"
                      onClick={() => onSkillChange(level)}
                    >
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Servings */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Servings: {targetServings}</Label>
                <div className="flex gap-1">
                  {[1, 2, 4, 6, 8].map((servings) => (
                    <Badge
                      key={servings}
                      variant={targetServings === servings ? "default" : "secondary"}
                      className="cursor-pointer text-xs"
                      onClick={() => onServingsChange(servings)}
                    >
                      {servings}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Spiciness Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Spiciness Level</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Badge
                      key={level}
                      variant={spicinessLevel === level ? "default" : "secondary"}
                      className="cursor-pointer text-xs"
                      onClick={() => onSpicinessChange(level)}
                    >
                      {'🌶️'.repeat(level)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Loading Progress */}
          <AILoadingProgress
            isLoading={isGenerating}
            message={`AI is ${isCreateMode ? 'generating' : 'modifying'} recipe...`}
            className="mt-4"
          />
          
          <AILoadingProgress
            isLoading={isSaving}
            message="Saving recipe..."
            className="mt-4"
          />
          
          {/* Extra padding to ensure space for floating button */}
          <div className="h-24"></div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSidebar;
