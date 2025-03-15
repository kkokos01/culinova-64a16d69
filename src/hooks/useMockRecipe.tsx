import { useEffect, useState } from "react";
import { Recipe, Food, Unit, Ingredient, Step } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Mock data for testing while we resolve Supabase UUID issues
const mockFoods: Record<string, Food> = {
  "flour": {
    id: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
    name: "All-purpose flour",
    description: "Regular wheat flour for baking",
    space_id: "space1",
    is_active: true,
    created_by: "user1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  "sugar": {
    id: "b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7",
    name: "Granulated sugar",
    description: "Regular white sugar",
    space_id: "space1",
    is_active: true,
    created_by: "user1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  "butter": {
    id: "c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8",
    name: "Unsalted butter",
    description: "Butter without added salt",
    space_id: "space1",
    is_active: true,
    created_by: "user1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  "eggs": {
    id: "d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9",
    name: "Large eggs",
    description: "Fresh chicken eggs",
    space_id: "space1",
    is_active: true,
    created_by: "user1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  "vanilla": {
    id: "e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0",
    name: "Vanilla extract",
    description: "Pure vanilla flavoring",
    space_id: "space1",
    is_active: true,
    created_by: "user1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
};

const mockUnits: Record<string, Unit> = {
  "cup": {
    id: "f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1",
    name: "cup",
    abbreviation: "cup",
    plural_name: "cups",
    measurement_system: "imperial",
    unit_type: "volume",
    base_unit: true,
    display_order: 1,
    formatting_template: "%v %u"
  },
  "tbsp": {
    id: "g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2",
    name: "tablespoon",
    abbreviation: "tbsp",
    plural_name: "tablespoons",
    measurement_system: "imperial",
    unit_type: "volume",
    base_unit: false,
    conversion_to_base: 0.0625,
    display_order: 2,
    formatting_template: "%v %u"
  },
  "tsp": {
    id: "h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3",
    name: "teaspoon",
    abbreviation: "tsp",
    plural_name: "teaspoons",
    measurement_system: "imperial",
    unit_type: "volume",
    base_unit: false,
    conversion_to_base: 0.0208333,
    display_order: 3,
    formatting_template: "%v %u"
  },
  "count": {
    id: "i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4",
    name: "count",
    abbreviation: "",
    plural_name: "",
    measurement_system: "universal",
    unit_type: "count",
    base_unit: true,
    display_order: 4,
    formatting_template: "%v"
  }
};

export const mockRecipe: Recipe = {
  id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
  title: "Classic Vanilla Cake",
  description: "A delicious homemade vanilla cake that's perfect for any celebration.",
  prep_time_minutes: 20,
  cook_time_minutes: 35,
  servings: 8,
  difficulty: "medium",
  image_url: "https://images.unsplash.com/photo-1464195244916-405fa0a82545?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  user_id: "user1",
  is_public: true,
  privacy_level: "public",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ingredients: [
    {
      id: "k1l2m3n4-o5p6-q7r8-s9t0-u1v2w3x4y5z6",
      food_id: mockFoods.flour.id,
      unit_id: mockUnits.cup.id,
      amount: 2,
      food: mockFoods.flour,
      unit: mockUnits.cup
    },
    {
      id: "l2m3n4o5-p6q7-r8s9-t0u1-v2w3x4y5z6a7",
      food_id: mockFoods.sugar.id,
      unit_id: mockUnits.cup.id,
      amount: 1.5,
      food: mockFoods.sugar,
      unit: mockUnits.cup
    },
    {
      id: "m3n4o5p6-q7r8-s9t0-u1v2-w3x4y5z6a7b8",
      food_id: mockFoods.butter.id,
      unit_id: mockUnits.cup.id,
      amount: 0.5,
      food: mockFoods.butter,
      unit: mockUnits.cup
    },
    {
      id: "n4o5p6q7-r8s9-t0u1-v2w3-x4y5z6a7b8c9",
      food_id: mockFoods.eggs.id,
      unit_id: mockUnits.count.id,
      amount: 2,
      food: mockFoods.eggs,
      unit: mockUnits.count
    },
    {
      id: "o5p6q7r8-s9t0-u1v2-w3x4-y5z6a7b8c9d0",
      food_id: mockFoods.vanilla.id,
      unit_id: mockUnits.tsp.id,
      amount: 2,
      food: mockFoods.vanilla,
      unit: mockUnits.tsp
    }
  ],
  steps: [
    {
      id: "p6q7r8s9-t0u1-v2w3-x4y5-z6a7b8c9d0e1",
      recipe_id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
      order_number: 1,
      instruction: "Preheat the oven to 350°F (175°C) and grease a 9-inch cake pan.",
      duration_minutes: 5,
    },
    {
      id: "q7r8s9t0-u1v2-w3x4-y5z6-a7b8c9d0e1f2",
      recipe_id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
      order_number: 2,
      instruction: "In a large bowl, cream together the butter and sugar until light and fluffy.",
      duration_minutes: 5,
    },
    {
      id: "r8s9t0u1-v2w3-x4y5-z6a7-b8c9d0e1f2g3",
      recipe_id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
      order_number: 3,
      instruction: "Beat in the eggs one at a time, then stir in the vanilla extract.",
      duration_minutes: 3,
    },
    {
      id: "s9t0u1v2-w3x4-y5z6-a7b8-c9d0e1f2g3h4",
      recipe_id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
      order_number: 4,
      instruction: "Gradually add in the flour, mixing until just incorporated.",
      duration_minutes: 3,
    },
    {
      id: "t0u1v2w3-x4y5-z6a7-b8c9-d0e1f2g3h4i5",
      recipe_id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
      order_number: 5,
      instruction: "Pour the batter into the prepared pan and smooth the top.",
      duration_minutes: 2,
    },
    {
      id: "u1v2w3x4-y5z6-a7b8-c9d0-e1f2g3h4i5j6",
      recipe_id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
      order_number: 6,
      instruction: "Bake for 30-35 minutes or until a toothpick inserted into the center comes out clean.",
      duration_minutes: 35,
    },
    {
      id: "v2w3x4y5-z6a7-b8c9-d0e1-f2g3h4i5j6k7",
      recipe_id: "j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5",
      order_number: 7,
      instruction: "Allow to cool in the pan for 10 minutes, then remove to a wire rack to cool completely.",
      duration_minutes: 10,
    }
  ]
};

export const useMockRecipe = (recipeId: string) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For now, always return our mock recipe regardless of ID
        setRecipe(mockRecipe);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch recipe"));
        setLoading(false);
        
        toast({
          title: "Error loading recipe",
          description: err instanceof Error ? err.message : "Failed to fetch recipe",
          variant: "destructive"
        });
      }
    };

    fetchRecipe();
  }, [recipeId, toast]);

  return { recipe, loading, error };
};
