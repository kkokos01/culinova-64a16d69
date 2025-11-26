import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Clock, ChefHat, X, Plus, Settings } from "lucide-react";

interface ConstraintSelectorProps {
  dietaryConstraints: string[];
  timeConstraints: string[];
  skillLevel: string;
  excludedIngredients: string[];
  spicinessLevel: number;
  targetServings: number;
  onDietaryChange: (constraints: string[]) => void;
  onTimeChange: (constraints: string[]) => void;
  onSkillChange: (level: string) => void;
  onExclusionsChange: (exclusions: string[]) => void;
  onSpicinessChange: (level: number) => void;
  onServingsChange: (servings: number) => void;
}

const dietaryOptions = [
  { id: "vegan", label: "Vegan", icon: <Leaf className="h-4 w-4" />, color: "bg-green-100 text-green-800 border-green-200" },
  { id: "vegetarian", label: "Vegetarian", icon: <Leaf className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "gluten-free", label: "Gluten-Free", icon: <Leaf className="h-4 w-4" />, color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "dairy-free", label: "Dairy-Free", icon: <Leaf className="h-4 w-4" />, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "low-sodium", label: "Low Sodium", icon: <Leaf className="h-4 w-4" />, color: "bg-pink-100 text-pink-800 border-pink-200" },
  { id: "keto", label: "Keto", icon: <Leaf className="h-4 w-4" />, color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "high-protein", label: "High-Protein", icon: <Leaf className="h-4 w-4" />, color: "bg-red-100 text-red-800 border-red-200" },
  { id: "low-carb", label: "Low-Carb", icon: <Leaf className="h-4 w-4" />, color: "bg-orange-100 text-orange-800 border-orange-200" }
];

const timeOptions = [
  { id: "under-15", label: "Under 15 minutes", icon: <Clock className="h-4 w-4" />, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "under-30", label: "Under 30 minutes", icon: <Clock className="h-4 w-4" />, color: "bg-green-100 text-green-800 border-green-200" },
  { id: "one-pot", label: "One-Pot", icon: <Settings className="h-4 w-4" />, color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "5-ingredients", label: "5-Ingredients Max", icon: <Settings className="h-4 w-4" />, color: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "no-cook", label: "No-Cook", icon: <Clock className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-800 border-cyan-200" }
];

const skillLevels = [
  { id: "beginner", label: "Beginner-Friendly", description: "Simple techniques, basic equipment" },
  { id: "intermediate", label: "Intermediate", description: "Some experience, standard equipment" },
  { id: "advanced", label: "Restaurant-Quality", description: "Complex techniques, special equipment" }
];

const commonAllergens = [
  "nuts", "peanuts", "shellfish", "eggs", "soy", "fish", "wheat", "sesame", "milk"
];

const ConstraintSelector: React.FC<ConstraintSelectorProps> = ({
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
  onServingsChange
}) => {
  const [currentExclusion, setCurrentExclusion] = useState("");

  const toggleDietaryConstraint = (constraintId: string) => {
    if (dietaryConstraints.includes(constraintId)) {
      onDietaryChange(dietaryConstraints.filter(id => id !== constraintId));
    } else {
      onDietaryChange([...dietaryConstraints, constraintId]);
    }
  };

  const toggleTimeConstraint = (constraintId: string) => {
    if (timeConstraints.includes(constraintId)) {
      onTimeChange(timeConstraints.filter(id => id !== constraintId));
    } else {
      onTimeChange([...timeConstraints, constraintId]);
    }
  };

  const addExclusion = () => {
    if (currentExclusion.trim() && !excludedIngredients.includes(currentExclusion.trim())) {
      onExclusionsChange([...excludedIngredients, currentExclusion.trim()]);
      setCurrentExclusion("");
    }
  };

  const removeExclusion = (exclusion: string) => {
    onExclusionsChange(excludedIngredients.filter(item => item !== exclusion));
  };

  const addAllergen = (allergen: string) => {
    if (!excludedIngredients.includes(allergen)) {
      onExclusionsChange([...excludedIngredients, allergen]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Advanced Options
          </CardTitle>
          <CardDescription>
            Customize your recipe with dietary preferences, time constraints, and skill level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dietary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dietary" className="text-xs">Dietary</TabsTrigger>
              <TabsTrigger value="time" className="text-xs">Time & Skill</TabsTrigger>
              <TabsTrigger value="ingredients" className="text-xs">Ingredients</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dietary" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Dietary Restrictions</Label>
                <p className="text-xs text-gray-500 mb-3">Select any dietary requirements</p>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((option) => (
                    <Badge
                      key={option.id}
                      variant={dietaryConstraints.includes(option.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        dietaryConstraints.includes(option.id) ? option.color : ""
                      }`}
                      onClick={() => toggleDietaryConstraint(option.id)}
                    >
                      <span className="flex items-center gap-1">
                        {option.icon}
                        {option.label}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="time" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Time Constraints</Label>
                <p className="text-xs text-gray-500 mb-3">Select timing preferences</p>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map((option) => (
                    <Badge
                      key={option.id}
                      variant={timeConstraints.includes(option.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        timeConstraints.includes(option.id) ? option.color : ""
                      }`}
                      onClick={() => toggleTimeConstraint(option.id)}
                    >
                      <span className="flex items-center gap-1">
                        {option.icon}
                        {option.label}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Skill Level</Label>
                <p className="text-xs text-gray-500 mb-3">Choose your cooking experience</p>
                <div className="grid grid-cols-1 gap-2">
                  {skillLevels.map((level) => (
                    <Card 
                      key={level.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        skillLevel === level.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => onSkillChange(level.id)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center">
                          <ChefHat className="h-4 w-4 mr-2" />
                          {level.label}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {level.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ingredients" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Exclude Ingredients</Label>
                <p className="text-xs text-gray-500 mb-3">Ingredients you don't want in your recipe</p>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={currentExclusion}
                    onChange={(e) => setCurrentExclusion(e.target.value)}
                    placeholder="Add ingredient to exclude..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
                  />
                  <Button type="button" onClick={addExclusion} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {excludedIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {excludedIngredients.map((exclusion) => (
                      <Badge
                        key={exclusion}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeExclusion(exclusion)}
                      >
                        {exclusion}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-gray-500 mb-2">Common allergens:</p>
                  <div className="flex flex-wrap gap-1">
                    {commonAllergens.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100 text-xs"
                        onClick={() => addAllergen(allergen)}
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Spiciness Level</Label>
                  <p className="text-xs text-gray-500 mb-2">1 (mild) - 5 (very spicy)</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={spicinessLevel >= level ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSpicinessChange(level)}
                        className="w-8 h-8 p-0"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Target Servings</Label>
                  <p className="text-xs text-gray-500 mb-2">Number of servings</p>
                  <Select value={targetServings.toString()} onValueChange={(value) => onServingsChange(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 serving</SelectItem>
                      <SelectItem value="2">2 servings</SelectItem>
                      <SelectItem value="4">4 servings</SelectItem>
                      <SelectItem value="6">6 servings</SelectItem>
                      <SelectItem value="8">8 servings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConstraintSelector;
