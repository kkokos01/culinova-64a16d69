
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, ChevronRight, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recipe } from "@/types";

interface AIModificationPanelProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onStartModification: (modificationType: string) => void;
}

const modificationTypes = [
  {
    id: "dietary",
    title: "Dietary Restrictions",
    description: "Modify for vegetarian, vegan, gluten-free, etc.",
    icon: <Info className="h-8 w-8 text-green-500" />
  },
  {
    id: "scaling",
    title: "Scale Recipe",
    description: "Adjust ingredients for different servings",
    icon: <Settings className="h-8 w-8 text-blue-500" />
  },
  {
    id: "time",
    title: "Quick & Easy",
    description: "Simplify and speed up preparation",
    icon: <ChevronRight className="h-8 w-8 text-amber-500" />
  }
];

const AIModificationPanel: React.FC<AIModificationPanelProps> = ({ 
  recipe, 
  isOpen, 
  onClose, 
  onStartModification 
}) => {
  const [selectedModification, setSelectedModification] = React.useState("");
  
  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-xl font-bold mb-4">Recipe Modification</h2>
      <p className="text-gray-600 mb-6">
        Select how you'd like to modify this recipe using AI
      </p>
      
      <Tabs defaultValue="options" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="options" className="flex-1">Modification Options</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">Custom Instructions</TabsTrigger>
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
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="flex-shrink-0">
                    {type.icon}
                  </div>
                  <div>
                    <CardTitle>{type.title}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                </CardHeader>
                {selectedModification === type.id && (
                  <CardContent>
                    <div className="pt-2">
                      <Button 
                        className="w-full mt-2"
                        onClick={() => onStartModification(type.id)}
                      >
                        Continue with {type.title}
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
            <CardHeader>
              <CardTitle>Custom AI Instructions</CardTitle>
              <CardDescription>
                Tell the AI exactly how you want to modify this recipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea 
                  className="w-full h-32 p-3 border rounded-md" 
                  placeholder="Example: Make this recipe keto-friendly and reduce the cooking time by 15 minutes"
                />
                <Button className="w-full">
                  Generate Modification
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
