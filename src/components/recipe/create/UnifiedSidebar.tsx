import React, { useState, forwardRef } from "react";
import { Recipe, Ingredient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Wand2, Lightbulb, Settings, Loader2 } from "lucide-react";
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

const UnifiedSidebar = forwardRef<HTMLDivElement, UnifiedSidebarProps>(({
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
}, ref) => {
  const [isQuickConceptsOpen, setIsQuickConceptsOpen] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);

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
      <div ref={ref} className="flex-1">
      {/* Scrollable Content */}
      <div className="overflow-y-auto h-full">
        <Card className="rounded-none border-x-0 border-t-0 border-b border-white/20 shadow-none bg-white/10 backdrop-blur-sm">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-sage-600">
              {isCreateMode ? 'Create Recipe' : 'Modify Recipe'}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onTogglePanel}
              className="text-white hover:text-sage-200 hover:bg-white/10"
            >
              {isPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </CardHeader>
        </Card>
        
        <div className="p-4 space-y-8">
          <p className="text-sage-100 text-sm">
            {isCreateMode 
              ? 'Create a new recipe with AI assistance' 
              : 'Customize this recipe with AI assistance'
            }
          </p>
          
          {/* 1. User Input Section (Always Open) */}
          <div className="space-y-3">
            <Label htmlFor="user-input" className="text-base font-semibold text-white">
              {isCreateMode ? '1. Describe your idea' : '1. Describe your modification'}
            </Label>
            <Textarea
              id="user-input"
              value={userInput}
              onChange={(e) => onUserInputChange(e.target.value)}
              placeholder={isCreateMode 
                ? 'What would you like to make? Be specific about ingredients, flavors, or style...' 
                : 'How would you like to modify this recipe? Describe your desired changes...'
              }
              className="w-full text-black placeholder:text-gray-500 resize-none"
              rows={4}
            />
            <p className="text-xs text-sage-100 italic">
              💡 Tip: The more detailed your description, the better Culinova can tailor your recipe.
            </p>
          </div>

          {/* 2. Quick Concepts Section (Collapsible, Open by Default) */}
          <div className="space-y-3">
            <Collapsible open={isQuickConceptsOpen} onOpenChange={setIsQuickConceptsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto bg-white/10 hover:bg-white/20 text-white rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Wand2 className="h-4 w-4" />
                    <span className="font-semibold">2. Quick {isCreateMode ? 'Concepts' : 'Modifications'}</span>
                  </div>
                  {isQuickConceptsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <p className="text-xs text-sage-100 italic">
                  🎯 Optional: Choose one to inspire your recipe, or combine with your description above
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickConcepts.map((concept, index) => (
                    <button
                      key={index}
                      onClick={() => onQuickConceptSelect(selectedQuickConcept === concept ? "" : concept)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedQuickConcept === concept
                          ? 'bg-white text-sage-700 shadow-sm'
                          : 'bg-sage-100 hover:bg-sage-200 text-sage-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-sage-400 mr-2"></span>
                      {concept}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* 3. Advanced Options Section (Collapsible, Closed by Default) */}
          <div className="space-y-3">
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto bg-white/10 hover:bg-white/20 text-white rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-semibold">3. Advanced Options (Optional)</span>
                  </div>
                  {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-3">
                <p className="text-xs text-sage-100 italic">
                  ⚙️ Optional: Add dietary filters and constraints for the AI to respect
                </p>
                
                {/* Cuisine Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Cuisine Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {inspirations.map((cuisine, index) => (
                      <button
                        key={index}
                        onClick={() => onInspirationSelect(selectedInspiration === cuisine ? "" : cuisine)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedInspiration === cuisine
                            ? 'bg-white text-sage-700 shadow-sm'
                            : 'bg-sage-100 hover:bg-sage-200 text-sage-700'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-sage-500 mr-2"></span>
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>
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
                  <Label className="text-sm font-medium text-gray-900">Skill Level {skillLevel ? `(${skillLevel})` : ""}</Label>
                  <div className="flex gap-1">
                    {skillLevels.map((level) => (
                      <Badge
                        key={level}
                        variant={skillLevel === level ? "default" : "secondary"}
                        className="cursor-pointer text-xs"
                        onClick={() => onSkillChange(skillLevel === level ? "" : level)}
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Servings */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Servings {targetServings ? `(${targetServings})` : ""}</Label>
                  <div className="flex gap-1">
                    {[1, 2, 4, 6, 8].map((servings) => (
                      <Badge
                        key={servings}
                        variant={targetServings === servings ? "default" : "secondary"}
                        className="cursor-pointer text-xs"
                        onClick={() => onServingsChange(targetServings === servings ? 0 : servings)}
                      >
                        {servings}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Spiciness Level */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">Spiciness Level {spicinessLevel > 0 ? `(${'🌶️'.repeat(spicinessLevel)})` : ""}</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Badge
                        key={level}
                        variant={spicinessLevel === level ? "default" : "secondary"}
                        className="cursor-pointer text-xs"
                        onClick={() => onSpicinessChange(spicinessLevel === level ? 0 : level)}
                      >
                        {'🌶️'.repeat(level)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* AI Clarity Section */}
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-sage-100 leading-relaxed">
              🤖 <strong>How Culinova works:</strong> We use your description + any selected concepts + optional constraints to generate a perfectly tailored recipe.
            </p>
          </div>
          
          {/* Extra padding to ensure space for floating button */}
          <div className="h-24"></div>
        </div>
      </div>
      </div>
    </div>
  );
});

UnifiedSidebar.displayName = 'UnifiedSidebar';

export default UnifiedSidebar;
