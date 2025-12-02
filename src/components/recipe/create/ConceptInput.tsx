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
    id: "pasta",
    title: "Quick Pasta Dish",
    concept: "A quick pasta dish that's delicious and can be made in under 30 minutes",
    icon: <ChefHat className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
  },
  {
    id: "chicken",
    title: "One-Pan Chicken",
    concept: "A one-pan chicken dinner that's flavorful with minimal cleanup",
    icon: <ChefHat className="h-5 w-5 text-green-500" />,
    color: "bg-green-50 hover:bg-green-100 border-green-200"
  },
  {
    id: "salad",
    title: "Healthy Salad",
    concept: "A healthy salad that's nutritious, fresh, and satisfying",
    icon: <Leaf className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
  },
  {
    id: "soup",
    title: "Comfort Soup",
    concept: "A comforting soup that's warm, hearty, and perfect for cold days",
    icon: <Heart className="h-5 w-5 text-red-500" />,
    color: "bg-red-50 hover:bg-red-100 border-red-200"
  },
  {
    id: "stir-fry",
    title: "Stir-Fry Dinner",
    concept: "A quick stir-fry dinner that's packed with vegetables and flavor",
    icon: <Zap className="h-5 w-5 text-yellow-500" />,
    color: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
  },
  {
    id: "breakfast",
    title: "Breakfast Bowl",
    concept: "A nutritious breakfast bowl that's energizing and delicious",
    icon: <Home className="h-5 w-5 text-orange-500" />,
    color: "bg-orange-50 hover:bg-orange-100 border-orange-200"
  },
  {
    id: "protein",
    title: "High-Protein Meal",
    concept: "A high-protein meal perfect for fitness and muscle building",
    icon: <Zap className="h-5 w-5 text-purple-500" />,
    color: "bg-purple-50 hover:bg-purple-100 border-purple-200"
  },
  {
    id: "vegetarian",
    title: "Vegetarian Dinner",
    concept: "A delicious vegetarian dinner that's full of flavor and satisfying",
    icon: <Leaf className="h-5 w-5 text-green-600" />,
    color: "bg-green-50 hover:bg-green-100 border-green-200"
  },
  {
    id: "sheet-pan",
    title: "Sheet-Pan Meal",
    concept: "An easy sheet-pan meal with minimal prep and cleanup",
    icon: <ChefHat className="h-5 w-5 text-blue-600" />,
    color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
  },
  {
    id: "five-ingredient",
    title: "5-Ingredient Meal",
    concept: "A simple meal using just 5 main ingredients for quick cooking",
    icon: <Clock className="h-5 w-5 text-cyan-500" />,
    color: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200"
  },
  {
    id: "slow-cooker",
    title: "Slow Cooker Meal",
    concept: "A set-it-and-forget-it slow cooker meal that's tender and flavorful",
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    color: "bg-amber-50 hover:bg-amber-100 border-amber-200"
  },
  {
    id: "low-carb",
    title: "Low-Carb Bowl",
    concept: "A low-carb bowl that's satisfying and perfect for keto or low-carb diets",
    icon: <Leaf className="h-5 w-5 text-pink-500" />,
    color: "bg-pink-50 hover:bg-pink-100 border-pink-200"
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
