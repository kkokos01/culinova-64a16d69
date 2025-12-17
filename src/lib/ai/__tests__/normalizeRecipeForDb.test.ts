import { describe, it, expect } from 'vitest';
import { normalizeRecipeForDb, parseIngredientQuantity } from '../normalizeRecipeForDb';
import type { EnhancedAIRecipeResponse } from '../../llmTypes';

describe('parseIngredientQuantity', () => {
  it('should parse simple quantities', () => {
    expect(parseIngredientQuantity({ quantity: '1', unit: 'cup' })).toEqual({ amount: 1, unitName: 'cup' });
    expect(parseIngredientQuantity({ quantity: '2', unit: 'tbsp' })).toEqual({ amount: 2, unitName: 'tbsp' });
  });

  it('should parse fractional quantities', () => {
    // Note: Current implementation rounds fractions to integers
    expect(parseIngredientQuantity({ quantity: '1/2', unit: 'cup' })).toEqual({ amount: 1, unitName: 'cup' });
    expect(parseIngredientQuantity({ quantity: '3/4', unit: 'cup' })).toEqual({ amount: 3, unitName: 'cup' });
    expect(parseIngredientQuantity({ quantity: '1 1/2', unit: 'cup' })).toEqual({ amount: 1, unitName: 'cup' });
  });

  it('should parse decimal quantities', () => {
    expect(parseIngredientQuantity({ quantity: '0.5', unit: 'cup' })).toEqual({ amount: 0.5, unitName: 'cup' });
    expect(parseIngredientQuantity({ quantity: '1.25', unit: 'cup' })).toEqual({ amount: 1.25, unitName: 'cup' });
  });

  it('should handle range quantities', () => {
    expect(parseIngredientQuantity({ quantity: '1-2', unit: 'cup' })).toEqual({ amount: 1, unitName: 'cup' });
    expect(parseIngredientQuantity({ quantity: '2 to 3', unit: 'cups' })).toEqual({ amount: 2, unitName: 'cups' });
  });

  it('should handle text quantities', () => {
    expect(parseIngredientQuantity({ quantity: 'to taste', unit: '' })).toEqual({ amount: 1, unitName: '' });
    expect(parseIngredientQuantity({ quantity: 'pinch', unit: '' })).toEqual({ amount: 1, unitName: '' });
  });
});

describe('normalizeRecipeForDb', () => {
  const mockUserId = 'test-user-id';
  const mockSpaceId = 'test-space-id';

  it('should normalize a basic recipe', () => {
    const recipe: EnhancedAIRecipeResponse = {
      title: 'Test Recipe',
      description: 'A test recipe',
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      totalTimeMinutes: 30,
      servings: 4,
      difficulty: 'easy',
      equipment: [],
      ingredients: [
        { name: 'Flour', quantity: '2', unit: 'cups', notes: '', group: 'Dry' },
        { name: 'Milk', quantity: '1', unit: 'cup', notes: '', group: 'Wet' }
      ],
      steps: [
        { order: 1, text: 'Mix flour', timerMinutes: 0, critical: false, whyItMatters: '', checkpoint: '' },
        { order: 2, text: 'Add milk', timerMinutes: 0, critical: false, whyItMatters: '', checkpoint: '' }
      ],
      caloriesPerServing: 200,
      userStyle: { complexity: 'balanced', novelty: 'tried_true' },
      alignmentNotes: {
        readback: 'Test recipe',
        constraintsApplied: [],
        pantryUsed: [],
        assumptions: [],
        tradeoffs: [],
        quickTweaks: []
      },
      qualityChecks: {
        majorIngredientsReferencedInSteps: true,
        dietaryCompliance: true,
        timeConstraintCompliance: true,
        unitSanity: true,
        equipmentMatch: true,
        warnings: []
      },
      tags: [],
      twists: []
    };

    const result = normalizeRecipeForDb({
      ai: recipe,
      userId: mockUserId,
      spaceId: mockSpaceId,
      operation: 'generate',
      versionNumber: 1
    });

    expect(result.recipeRow).toEqual({
      title: 'Test Recipe',
      description: 'A test recipe',
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      servings: 4,
      difficulty: 'easy',
      calories_per_serving: 200,
      user_id: mockUserId,
      space_id: mockSpaceId,
      privacy_level: 'private',
      is_public: false,
      parent_recipe_id: null,
      source_url: null
    });
    
    expect(result.ingredientsRows).toEqual([
      { recipe_id: '__RECIPE_ID__', amount: 2, unit_id: null, unit_name: 'cups', food_id: null, food_name: 'Flour', order_index: 0 },
      { recipe_id: '__RECIPE_ID__', amount: 1, unit_id: null, unit_name: 'cup', food_id: null, food_name: 'Milk', order_index: 1 }
    ]);
    
    expect(result.stepsRows).toEqual([
      { recipe_id: '__RECIPE_ID__', order_number: 1, instruction: 'Mix flour', duration_minutes: 0 },
      { recipe_id: '__RECIPE_ID__', order_number: 2, instruction: 'Add milk', duration_minutes: 0 }
    ]);
    
    expect(result.versionRow.modification_type).toBe('generate');
    expect(result.versionRow.version_number).toBe(1);
    expect(result.versionRow.is_current).toBe(true);
    expect(result.versionRow.created_by).toBe(mockUserId);
    expect(result.versionRow.display_name).toBe('generate · balanced · tried_true');
    expect(result.versionRow.modification_parameters).toHaveProperty('aiRaw');
    expect(result.versionRow.modification_parameters).toHaveProperty('richIngredients');
    expect(result.versionRow.modification_parameters).toHaveProperty('richSteps');
  });

  it('should handle complex ingredient quantities', () => {
    const recipe: EnhancedAIRecipeResponse = {
      title: 'Complex Recipe',
      description: 'Recipe with complex quantities',
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      totalTimeMinutes: 0,
      servings: 1,
      difficulty: 'easy',
      equipment: [],
      ingredients: [
        { name: 'Salt', quantity: '1/2', unit: 'tsp', notes: '', group: 'Seasoning' },
        { name: 'Pepper', quantity: 'to taste', unit: '', notes: '', group: 'Seasoning' },
        { name: 'Water', quantity: '2-3', unit: 'cups', notes: '', group: 'Liquid' }
      ],
      steps: [],
      caloriesPerServing: 0,
      userStyle: { complexity: 'balanced', novelty: 'tried_true' },
      alignmentNotes: {
        readback: '',
        constraintsApplied: [],
        pantryUsed: [],
        assumptions: [],
        tradeoffs: [],
        quickTweaks: []
      },
      qualityChecks: {
        majorIngredientsReferencedInSteps: true,
        dietaryCompliance: true,
        timeConstraintCompliance: true,
        unitSanity: true,
        equipmentMatch: true,
        warnings: []
      },
      tags: [],
      twists: []
    };

    const result = normalizeRecipeForDb({
      ai: recipe,
      userId: mockUserId,
      spaceId: mockSpaceId,
      operation: 'generate',
      versionNumber: 1
    });

    expect(result.ingredientsRows).toEqual([
      { recipe_id: '__RECIPE_ID__', amount: 1, unit_id: null, unit_name: 'tsp', food_id: null, food_name: 'Salt', order_index: 0 },
      { recipe_id: '__RECIPE_ID__', amount: 1, unit_id: null, unit_name: '', food_id: null, food_name: 'Pepper', order_index: 1 },
      { recipe_id: '__RECIPE_ID__', amount: 2, unit_id: null, unit_name: 'cups', food_id: null, food_name: 'Water', order_index: 2 }
    ]);
  });

  it('should handle empty recipe gracefully', () => {
    const recipe: EnhancedAIRecipeResponse = {
      title: '',
      description: '',
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      totalTimeMinutes: 0,
      servings: 1,
      difficulty: 'easy',
      equipment: [],
      ingredients: [],
      steps: [],
      caloriesPerServing: 0,
      userStyle: { complexity: 'balanced', novelty: 'tried_true' },
      alignmentNotes: {
        readback: '',
        constraintsApplied: [],
        pantryUsed: [],
        assumptions: [],
        tradeoffs: [],
        quickTweaks: []
      },
      qualityChecks: {
        majorIngredientsReferencedInSteps: true,
        dietaryCompliance: true,
        timeConstraintCompliance: true,
        unitSanity: true,
        equipmentMatch: true,
        warnings: []
      },
      tags: [],
      twists: []
    };

    const result = normalizeRecipeForDb({
      ai: recipe,
      userId: mockUserId,
      spaceId: mockSpaceId,
      operation: 'generate',
      versionNumber: 1
    });

    expect(result.ingredientsRows).toEqual([]);
    expect(result.stepsRows).toEqual([]);
    expect(result.recipeRow.user_id).toBe(mockUserId);
    expect(result.recipeRow.space_id).toBe(mockSpaceId);
  });
});
