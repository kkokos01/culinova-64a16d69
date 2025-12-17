import { describe, it, expect } from 'vitest';
import type { Ingredient } from '@/types';

// Mock the ingredient selection logic from RecipeCreatePage
describe('Ingredient Selection Logic', () => {
  const mockIngredient: Ingredient = {
    id: 'ing-1',
    food_id: null,
    unit_id: null,
    food_name: 'test ingredient',
    unit_name: 'cup',
    amount: 1
  };

  it('should build modification instructions correctly', () => {
    // Simulate selected ingredients map
    const selectedIngredients = new Map([
      ['ing-1', { ingredient: mockIngredient, action: 'increase' as const }],
      ['ing-2', { 
        ingredient: { ...mockIngredient, id: 'ing-2', food_name: 'garlic' }, 
        action: 'remove' as const 
      }],
      ['ing-3', { 
        ingredient: { ...mockIngredient, id: 'ing-3', food_name: 'onion' }, 
        action: 'decrease' as const 
      }]
    ]);

    // Build modification instructions (same logic as in RecipeCreatePage)
    const ingredientMods = Array.from(selectedIngredients.values()).map(
      selection => {
        const ingredient = selection.ingredient;
        const action = selection.action;
        const ingredientName = ingredient.food_name || 'Unknown ingredient';
        switch (action) {
          case "increase":
            return `Increase the amount of ${ingredientName}`;
          case "decrease":
            return `Decrease the amount of ${ingredientName}`;
          case "remove":
            return `Remove ${ingredientName}`;
          default:
            return "";
        }
      }
    ).filter(Boolean).join(", ");

    const modificationInstructions = "Ingredient modifications: " + ingredientMods;

    expect(modificationInstructions).toBe(
      "Ingredient modifications: Increase the amount of test ingredient, Remove garlic, Decrease the amount of onion"
    );
  });

  it('should handle empty selections', () => {
    const selectedIngredients = new Map();
    const hasIngredientSelections = selectedIngredients.size > 0;
    
    expect(hasIngredientSelections).toBe(false);
  });

  it('should handle single selection', () => {
    const selectedIngredients = new Map([
      ['ing-1', { ingredient: mockIngredient, action: 'remove' as const }]
    ]);

    const ingredientMods = Array.from(selectedIngredients.values()).map(
      selection => {
        const ingredient = selection.ingredient;
        const action = selection.action;
        const ingredientName = ingredient.food_name || 'Unknown ingredient';
        switch (action) {
          case "remove":
            return `Remove ${ingredientName}`;
          default:
            return "";
        }
      }
    ).filter(Boolean).join(", ");

    expect(ingredientMods).toBe("Remove test ingredient");
  });

  it('should handle unknown ingredient names', () => {
    const ingredientWithoutName: Ingredient = {
      id: 'ing-unknown',
      food_id: null,
      unit_id: null,
      food_name: undefined,
      unit_name: 'cup',
      amount: 1
    };

    const selectedIngredients = new Map([
      ['ing-unknown', { ingredient: ingredientWithoutName, action: 'increase' as const }]
    ]);

    const ingredientMods = Array.from(selectedIngredients.values()).map(
      selection => {
        const ingredient = selection.ingredient;
        const action = selection.action;
        const ingredientName = ingredient.food_name || 'Unknown ingredient';
        switch (action) {
          case "increase":
            return `Increase the amount of ${ingredientName}`;
          default:
            return "";
        }
      }
    ).filter(Boolean).join(", ");

    expect(ingredientMods).toBe("Increase the amount of Unknown ingredient");
  });
});

// Test the modification request building
describe('Modification Request Building', () => {
  it('should combine all modification types', () => {
    const userInput = "make it spicier";
    const customInstructions = "add more vegetables";
    const selectedQuickModifications = ["make it healthier"];
    const ingredientMods = "Remove salt, Increase pepper";

    let modificationInstructions = "";

    // Add user input
    if (userInput.trim()) {
      modificationInstructions = userInput.trim();
    }

    // Add quick modifications
    if (selectedQuickModifications.length > 0) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += "Quick modifications: " + selectedQuickModifications.join(", ");
    }

    // Add ingredient selections
    if (ingredientMods) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += "Ingredient modifications: " + ingredientMods;
    }

    // Add custom instructions
    if (customInstructions.trim()) {
      if (modificationInstructions.length > 0) modificationInstructions += ". ";
      modificationInstructions += customInstructions.trim();
    }

    expect(modificationInstructions).toBe(
      "make it spicier. Quick modifications: make it healthier. Ingredient modifications: Remove salt, Increase pepper. add more vegetables"
    );
  });

  it('should handle only ingredient modifications', () => {
    const ingredientMods = "Remove garlic";
    let modificationInstructions = "";

    if (ingredientMods) {
      modificationInstructions = "Ingredient modifications: " + ingredientMods;
    }

    expect(modificationInstructions).toBe("Ingredient modifications: Remove garlic");
  });
});
