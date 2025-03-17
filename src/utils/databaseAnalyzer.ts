
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to analyze database structure and query results
 * for diagnosing type issues with Supabase joins
 */
export const databaseAnalyzer = {
  /**
   * Analyze recipe ingredients to check the structure of joined data
   */
  async analyzeRecipeIngredients(recipeId: string) {
    if (!recipeId) return { error: "No recipe ID provided" };
    
    try {
      console.log("Analyzing recipe ingredients for ID:", recipeId);
      
      // Query with both plural and singular aliases to compare
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          id,
          recipe_id,
          food_id, 
          unit_id,
          amount,
          foods:food_id(id, name, description),
          food:food_id(id, name, description),
          units:unit_id(id, name, abbreviation),
          unit:unit_id(id, name, abbreviation)
        `)
        .eq('recipe_id', recipeId)
        .limit(1);
        
      if (error) {
        console.error("Error fetching ingredients:", error);
        return { error: error.message };
      }
      
      if (!data || data.length === 0) {
        return { error: "No ingredients found for this recipe" };
      }
      
      // Analyze the first ingredient
      const ingredient = data[0];
      
      // Check property types
      const analysis = {
        foodsIsDefined: ingredient.foods !== undefined,
        foodsIsArray: Array.isArray(ingredient.foods),
        foodsType: typeof ingredient.foods,
        foodsStructure: ingredient.foods ? JSON.stringify(ingredient.foods).substring(0, 100) : 'undefined',
        
        foodIsDefined: ingredient.food !== undefined,
        foodIsArray: Array.isArray(ingredient.food),
        foodType: typeof ingredient.food,
        foodStructure: ingredient.food ? JSON.stringify(ingredient.food).substring(0, 100) : 'undefined',
        
        unitsIsDefined: ingredient.units !== undefined,
        unitsIsArray: Array.isArray(ingredient.units),
        unitsType: typeof ingredient.units,
        unitsStructure: ingredient.units ? JSON.stringify(ingredient.units).substring(0, 100) : 'undefined',
        
        unitIsDefined: ingredient.unit !== undefined,
        unitIsArray: Array.isArray(ingredient.unit),
        unitType: typeof ingredient.unit,
        unitStructure: ingredient.unit ? JSON.stringify(ingredient.unit).substring(0, 100) : 'undefined',
      };
      
      return {
        ingredient,
        analysis,
        recommendation: this.generateRecommendation(analysis)
      };
    } catch (err) {
      console.error("Analysis error:", err);
      return { error: err instanceof Error ? err.message : String(err) };
    }
  },
  
  /**
   * Generate a recommendation based on the analysis
   */
  generateRecommendation(analysis: any) {
    // Check if we have a mismatch between naming and structure
    const hasMismatch = 
      (analysis.foodsIsDefined && !analysis.foodsIsArray && analysis.foodsType === 'object') ||
      (analysis.unitsIsDefined && !analysis.unitsIsArray && analysis.unitsType === 'object');
      
    if (hasMismatch) {
      return `
        MISMATCH DETECTED: The Supabase query is returning objects with plural names (foods, units),
        but these are actually singular objects, not arrays. This explains the TypeScript errors.
        
        Recommendation: Update your Supabase queries to use singular aliases (food:food_id, unit:unit_id)
        to match your TypeScript types, or update your types to expect the plural names.
      `;
    }
    
    return "No obvious mismatch detected in the data structure.";
  }
};
