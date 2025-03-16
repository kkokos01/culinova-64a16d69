
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, Settings, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recipe, Ingredient } from "@/types";
import SelectedIngredientsPanel from "./SelectedIngredientsPanel";

interface AIModificationPanelProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onStartModification: (modificationType: string) => void;
  selectedIngredients: Map<string, { ingredient: Ingredient, action: "increase" | "decrease" | "remove" }>;
  onRemoveIngredientSelection: (id: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (instructions: string) => void;
}

const modificationTypes = [
  {
    id: "dietary",
    title: "Dietary Restrictions",
    description: "Modify for vegetarian, vegan, gluten-free, etc.",
    icon: <Info className="h-6 w-6 text-green-500" />
  },
  {
    id: "scaling",
    title: "Scale Recipe",
    description: "Adjust ingredients for different servings",
    icon: <Settings className="h-6 w-6 text-blue-500" />
  },
  {
    id: "time",
    title: "Quick & Easy",
    description: "Simplify and speed up preparation",
    icon: <Clock className="h-6 w-6 text-amber-500" />
  }
];

const AIModificationPanel: React.FC<AIModificationPanelProps> = ({ 
  recipe, 
  isOpen, 
  onClose, 
  onStartModification,
  selectedIngredients,
  onRemoveIngredientSelection,
  customInstructions,
  onCustomInstructionsChange
}) => {
  const [selectedModification, setSelectedModification] = React.useState("");
  
  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Recipe Modification</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6">
        Select how you'd like to modify this recipe using AI
      </p>
      
      <Tabs defaultValue="options" className="w-full">
        <TabsList className="w-full mb-4 grid grid-cols-2">
          <TabsTrigger 
            value="options" 
            className="text-xs sm:text-sm px-2 py-1.5 break-words line-clamp-2 h-auto min-h-[40px] whitespace-normal"
          >
            Modification Options
          </TabsTrigger>
          <TabsTrigger 
            value="custom" 
            className="text-xs sm:text-sm px-2 py-1.5 break-words line-clamp-2 h-auto min-h-[40px] whitespace-normal"
          >
            Custom Instructions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="options">
          <div className="grid gap-4">
            {modificationTypes.map((type) => (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedModification === type.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedModification(type.id)}
              >
                <CardHeader className="flex flex-row items-start gap-3 pb-2 p-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {type.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base break-words">{type.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm line-clamp-3 break-words">
                      {type.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                {selectedModification === type.id && (
                  <CardContent className="p-4 pt-0">
                    <SelectedIngredientsPanel 
                      selectedIngredients={selectedIngredients}
                      onRemoveSelection={onRemoveIngredientSelection}
                    />
                    <div className="pt-2">
                      <Button 
                        className="w-full mt-2 text-sm"
                        onClick={() => onStartModification(type.id)}
                      >
                        <span className="whitespace-normal break-words">Continue with {type.title}</span>
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base break-words">Custom AI Instructions</CardTitle>
              <CardDescription className="text-xs sm:text-sm break-words">
                Tell the AI exactly how you want to modify this recipe
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <textarea 
                  className="w-full h-24 sm:h-32 p-3 border rounded-md text-sm" 
                  placeholder="Example: Make this recipe keto-friendly and reduce the cooking time by 15 minutes"
                  value={customInstructions}
                  onChange={(e) => onCustomInstructionsChange(e.target.value)}
                />
                
                <SelectedIngredientsPanel 
                  selectedIngredients={selectedIngredients}
                  onRemoveSelection={onRemoveIngredientSelection}
                />
                
                <Button 
                  className="w-full text-sm"
                  onClick={() => onStartModification("custom")}
                >
                  <span className="whitespace-normal break-words">Generate Modification</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModificationPanel;
