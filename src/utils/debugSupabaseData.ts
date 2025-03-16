import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// This utility function helps inspect Supabase database data
export const useDebugSupabaseData = () => {
  const { toast } = useToast();

  // Inspect a single recipe with its details
  const inspectRecipe = async (recipeId: string) => {
    try {
      console.log("Inspecting recipe data structure:", recipeId);

      // Get the recipe basic info
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (recipeError) {
        throw new Error(`Failed to fetch recipe: ${recipeError.message}`);
      }

      console.log("Recipe base data:", recipe);

      // Get ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select(`
          *,
          food:food_id(id, name, description, category_id),
          unit:unit_id(id, name, abbreviation, plural_name)
        `)
        .eq('recipe_id', recipeId);

      if (ingredientsError) {
        throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
      }

      console.log("Ingredients data:", ingredients);

      // Get steps
      const { data: steps, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('order_number');

      if (stepsError) {
        throw new Error(`Failed to fetch steps: ${stepsError.message}`);
      }

      console.log("Steps data:", steps);

      // Check the recipe function's output
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_recipe_with_details', { recipe_id_param: recipeId });
        
      if (rpcError) {
        throw new Error(`Failed to fetch recipe via RPC: ${rpcError.message}`);
      }

      console.log("RPC function output:", rpcData);

      return {
        recipe,
        ingredients,
        steps,
        rpcData
      };
    } catch (err) {
      console.error("Error during database inspection:", err);
      toast({
        title: "Error inspecting database",
        description: err instanceof Error ? err.message : "Failed to inspect database data",
        variant: "destructive"
      });
      return null;
    }
  };

  // Get all foods available in the database
  const getAllFoods = async () => {
    try {
      const { data: foods, error } = await supabase
        .from('foods')
        .select('*')
        .order('name');
        
      if (error) {
        throw new Error(`Failed to fetch foods: ${error.message}`);
      }
      
      console.log("All available foods:", foods);
      return foods;
    } catch (err) {
      console.error("Error fetching foods:", err);
      toast({
        title: "Error fetching foods",
        description: err instanceof Error ? err.message : "Failed to fetch foods data",
        variant: "destructive"
      });
      return null;
    }
  };

  // Get all units available in the database
  const getAllUnits = async () => {
    try {
      const { data: units, error } = await supabase
        .from('units')
        .select('*')
        .order('display_order');
        
      if (error) {
        throw new Error(`Failed to fetch units: ${error.message}`);
      }
      
      console.log("All available units:", units);
      return units;
    } catch (err) {
      console.error("Error fetching units:", err);
      toast({
        title: "Error fetching units",
        description: err instanceof Error ? err.message : "Failed to fetch units data",
        variant: "destructive"
      });
      return null;
    }
  };

  // Analyze database structure for recipe-related tables
  const analyzeRecipeStructure = async () => {
    try {
      console.log("Analyzing recipe database structure...");
      
      // Get count of recipes
      const { count: recipeCount, error: recipeError } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true });
        
      if (recipeError) throw new Error(`Recipe count error: ${recipeError.message}`);
      
      // Get count of foods
      const { count: foodCount, error: foodError } = await supabase
        .from('foods')
        .select('*', { count: 'exact', head: true });
        
      if (foodError) throw new Error(`Food count error: ${foodError.message}`);
      
      // Get count of units
      const { count: unitCount, error: unitError } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true });
        
      if (unitError) throw new Error(`Unit count error: ${unitError.message}`);
      
      // Get ingredients sample
      const { data: ingredientsSample, error: ingredientsError } = await supabase
        .from('ingredients')
        .select(`
          *,
          food:food_id(id, name),
          unit:unit_id(id, name, abbreviation)
        `)
        .limit(10);
        
      if (ingredientsError) throw new Error(`Ingredients error: ${ingredientsError.message}`);
      
      // Get a sample of available recipes
      const { data: recipes, error: recipesListError } = await supabase
        .from('recipes')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (recipesListError) throw new Error(`Recipes list error: ${recipesListError.message}`);
      
      const analysisResults = {
        recipeCount,
        foodCount,
        unitCount,
        ingredientsSample,
        recentRecipes: recipes
      };
      
      console.log("Database analysis results:", analysisResults);
      return analysisResults;
    } catch (err) {
      console.error("Error analyzing database:", err);
      toast({
        title: "Error analyzing database",
        description: err instanceof Error ? err.message : "Failed to analyze database structure",
        variant: "destructive"
      });
      return null;
    }
  };

  // Perform a comprehensive database analysis
  const analyzeDatabaseComprehensive = async () => {
    try {
      console.log("Starting comprehensive database analysis...");
      
      // Table counts
      const tableCounts = await getTableCounts();
      console.log("Table record counts:", tableCounts);
      
      // Recipe details
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          id, 
          title, 
          description, 
          cook_time_minutes, 
          prep_time_minutes, 
          servings, 
          difficulty,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (recipesError) throw new Error(`Recipe fetch error: ${recipesError.message}`);
      console.log(`Found ${recipes.length} recipes`);
      
      // Get a sample recipe with all related data
      let sampleRecipeData = null;
      if (recipes.length > 0) {
        const sampleRecipeId = recipes[0].id;
        sampleRecipeData = await inspectRecipe(sampleRecipeId);
        console.log(`Sample recipe analysis complete for: ${recipes[0].title}`);
      }
      
      // Food categories analysis
      const { data: categories, error: categoriesError } = await supabase
        .from('food_categories')
        .select('*')
        .order('display_order');
        
      if (categoriesError) throw new Error(`Categories error: ${categoriesError.message}`);
      console.log(`Found ${categories.length} food categories`);
      
      // Units analysis
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('display_order');
        
      if (unitsError) throw new Error(`Units error: ${unitsError.message}`);
      console.log(`Found ${units.length} measurement units`);
      
      // Ingredients analysis
      const { data: ingredientStats, error: ingredientStatsError } = await supabase
        .from('ingredients')
        .select(`
          recipe_id,
          count(*) 
        `, { count: 'exact' })
        .group('recipe_id');
      
      if (ingredientStatsError) throw new Error(`Ingredient stats error: ${ingredientStatsError.message}`);
      
      // Steps analysis - check for duration_minutes usage
      const { data: stepsWithDuration, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .not('duration_minutes', 'is', null)
        .limit(10);
        
      if (stepsError) throw new Error(`Steps error: ${stepsError.message}`);
      
      const hasDurationMinutes = stepsWithDuration.length > 0;
      console.log(`Duration minutes usage in steps: ${hasDurationMinutes ? 'YES' : 'NO'}`);
      
      return {
        tableCounts,
        recipes: recipes.slice(0, 5), // First 5 recipes
        categories,
        units,
        ingredientStats,
        stepsWithDuration: stepsWithDuration.slice(0, 3), // Sample of steps with duration
        hasDurationMinutes,
        sampleRecipeData
      };
    } catch (err) {
      console.error("Error in comprehensive database analysis:", err);
      toast({
        title: "Database Analysis Error",
        description: err instanceof Error ? err.message : "Failed to analyze database",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Helper function to get record counts for all relevant tables
  const getTableCounts = async () => {
    const tables = [
      'recipes', 'ingredients', 'steps', 'foods', 
      'units', 'food_categories', 'recipe_versions'
    ];
    
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.warn(`Error getting count for ${table}: ${error.message}`);
        counts[table] = -1; // Mark as error
      } else {
        counts[table] = count || 0;
      }
    }
    
    return counts;
  };

  return { 
    inspectRecipe,
    getAllFoods,
    getAllUnits,
    analyzeRecipeStructure,
    analyzeDatabaseComprehensive
  };
};
