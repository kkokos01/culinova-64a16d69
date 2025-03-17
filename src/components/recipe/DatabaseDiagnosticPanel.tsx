
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { recipeService } from "@/services/supabase/recipeService";

interface DatabaseDiagnosticPanelProps {
  recipeId: string | undefined;
}

const DatabaseDiagnosticPanel: React.FC<DatabaseDiagnosticPanelProps> = ({ recipeId }) => {
  const [loading, setLoading] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Function to directly check the database using proper naming
  const checkRecipeInDatabase = async () => {
    setLoading(true);
    try {
      // First check if we are looking at the right recipe
      if (recipeId) {
        // Use our service instead of direct queries
        const recipeData = await recipeService.getRecipe(recipeId);
        
        if (!recipeData) {
          throw new Error("Recipe not found");
        }
        
        // Get direct ingredients data with consistent SINGULAR naming
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('ingredients')
          .select(`
            id,
            recipe_id,
            food_id,
            unit_id,
            amount,
            food:food_id(id, name, description),
            unit:unit_id(id, name, abbreviation)
          `)
          .eq('recipe_id', recipeId);
          
        if (ingredientsError) {
          throw new Error(`Error fetching ingredients: ${ingredientsError.message}`);
        }
        
        // Set comprehensive debug info
        setDebugInfo({
          recipe: recipeData,
          ingredients: ingredientsData
        });
        
        // Access first ingredient's food and unit correctly with singular naming
        let firstIngredientInfo = "None";
        if (ingredientsData && ingredientsData.length > 0) {
          // Fix: Cast to unknown first, then to IngredientData to avoid TypeScript error
          // or handle the possible array structure explicitly
          const firstIng = ingredientsData[0] as any;
          const foodName = firstIng.food ? 
            (Array.isArray(firstIng.food) ? firstIng.food[0]?.name : firstIng.food.name) || "None" : 
            "None";
          const amount = firstIng.amount || 0;
          const unitAbbr = firstIng.unit ? 
            (Array.isArray(firstIng.unit) ? firstIng.unit[0]?.abbreviation : firstIng.unit.abbreviation) || "" : 
            "";
          
          firstIngredientInfo = `${foodName} - ${amount} ${unitAbbr}`;
        }
        
        setDatabaseStatus(`Recipe in DB: ${recipeData.title}. Found ${ingredientsData?.length || 0} ingredients. 
        First ingredient: ${firstIngredientInfo}`);
      }
    } catch (error) {
      console.error("Database check error:", error);
      setDatabaseStatus(`Error checking database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Check the database when the component mounts or recipe ID changes
  useEffect(() => {
    if (recipeId) {
      checkRecipeInDatabase();
    }
  }, [recipeId]);

  if (!databaseStatus) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-amber-100 border border-amber-300 rounded-lg shadow-lg z-50 max-w-md text-sm">
      <h3 className="font-bold text-amber-800">Database Diagnostic</h3>
      <p className="text-amber-700">{databaseStatus}</p>
      {loading && <p className="text-amber-700">Loading...</p>}
      
      {debugInfo && (
        <div className="mt-2">
          <details>
            <summary className="cursor-pointer text-amber-800 font-medium">Show Raw Data</summary>
            <div className="mt-2 max-h-60 overflow-auto bg-white/50 p-2 rounded text-xs">
              <p><strong>Recipe:</strong> {debugInfo.recipe.title}</p>
              <p><strong>Ingredients Count:</strong> {debugInfo.ingredients?.length || 0}</p>
              <div className="mt-1">
                <strong>Ingredients:</strong> 
                <ul className="pl-4">
                  {debugInfo.ingredients?.map((ing: any) => {
                    // Handle possible array structure for food and unit
                    const foodName = ing.food ? 
                      (Array.isArray(ing.food) ? ing.food[0]?.name : ing.food.name) || 'Unknown' : 
                      'Unknown';
                    const unitAbbr = ing.unit ? 
                      (Array.isArray(ing.unit) ? ing.unit[0]?.abbreviation : ing.unit.abbreviation) || '' : 
                      '';
                      
                    return (
                      <li key={ing.id}>
                        {foodName} - {ing.amount} {unitAbbr}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default DatabaseDiagnosticPanel;
