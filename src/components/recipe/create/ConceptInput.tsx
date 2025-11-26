import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Clock, Users, Leaf, Zap, Globe, Home, Heart } from "lucide-react";

interface ConceptInputProps {
  concept: string;
  onConceptChange: (concept: string) => void;
  onQuickConceptSelect: (concept: string) => void;
}

const quickConcepts = [
  {
    id: "family",
    title: "Quick Family Dinner",
    concept: "A quick family dinner that's kid-friendly and can be made in under 30 minutes",
    icon: <Home className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
  },
  {
    id: "healthy",
    title: "Healthy Meal Prep",
    concept: "A healthy meal prep recipe that's nutritious and lasts well in the fridge",
    icon: <Leaf className="h-5 w-5 text-green-500" />,
    color: "bg-green-50 hover:bg-green-100 border-green-200"
  },
  {
    id: "comfort",
    title: "Comfort Classic",
    concept: "A comforting classic dish that's warm, hearty, and satisfying",
    icon: <Heart className="h-5 w-5 text-red-500" />,
    color: "bg-red-50 hover:bg-red-100 border-red-200"
  },
  {
    id: "vegetarian",
    title: "Vegetarian Delight",
    concept: "A delicious vegetarian dish that's full of flavor and protein",
    icon: <Leaf className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
  },
  {
    id: "protein",
    title: "High-Protein",
    concept: "A high-protein meal perfect for fitness and muscle building",
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
    color: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
  },
  {
    id: "low-sodium",
    title: "Low Sodium",
    concept: "A flavorful low-sodium dish that's heart-healthy",
    icon: <Heart className="h-5 w-5 text-pink-500" />,
    color: "bg-pink-50 hover:bg-pink-100 border-pink-200"
  },
  {
    id: "keto",
    title: "Keto",
    concept: "A keto-friendly meal that's low carb and high fat",
    icon: <ChefHat className="h-5 w-5 text-purple-500" />,
    color: "bg-purple-50 hover:bg-purple-100 border-purple-200"
  },
  {
    id: "global",
    title: "Global Flavors",
    concept: "An international dish with authentic global flavors and spices",
    icon: <Globe className="h-5 w-5 text-orange-500" />,
    color: "bg-orange-50 hover:bg-orange-100 border-orange-200"
  }
];

const examplePrompts = [
  "A high-protein breakfast smoothie",
  "A light summer pasta using tomatoes and basil",
  "A low-cost vegetarian dinner for 4",
  "A cozy fall soup from pantry staples",
  "A spicy Thai curry with coconut milk",
  "A gluten-free chocolate dessert",
  "A one-pan chicken dinner",
  "A Mediterranean salad with feta"
];

const ConceptInput: React.FC<ConceptInputProps> = ({ 
  concept, 
  onConceptChange, 
  onQuickConceptSelect 
}) => {
  const [focusedExample, setFocusedExample] = useState<number | null>(null);

  const handleExampleClick = (prompt: string) => {
    onConceptChange(prompt);
  };

  const handleQuickConceptClick = (quickConcept: typeof quickConcepts[0]) => {
    onConceptChange(quickConcept.concept);
    onQuickConceptSelect(quickConcept.title);
  };

  return (
    <div className="space-y-6">
      {/* Main Concept Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChefHat className="mr-2 h-5 w-5" />
            What do you want to make?
          </CardTitle>
          <CardDescription>
            Describe your recipe idea in natural language, or choose a quick concept below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              value={concept}
              onChange={(e) => onConceptChange(e.target.value)}
              placeholder="e.g., A high-protein breakfast smoothie with berries and spinach"
              className="text-base h-12"
            />
            
            {/* Character count indicator */}
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Be specific about ingredients, cooking style, and dietary preferences
              </p>
              <Badge variant="outline" className="text-xs">
                {concept.length}/200 characters
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Concept Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Concepts</CardTitle>
          <CardDescription>
            Click any concept to get started with a structured recipe idea
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickConcepts.map((quickConcept) => (
              <Card 
                key={quickConcept.id}
                className={`cursor-pointer transition-all hover:shadow-md ${quickConcept.color}`}
                onClick={() => handleQuickConceptClick(quickConcept)}
              >
                <CardHeader className="flex flex-row items-start gap-3 pb-2 p-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {quickConcept.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm break-words">
                      {quickConcept.title}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Example Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need inspiration?</CardTitle>
          <CardDescription>
            Try these example prompts to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="cursor-pointer hover:bg-gray-100 text-xs py-1 px-2"
                onClick={() => handleExampleClick(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConceptInput;
