
import { useEffect, useState } from "react";
import { RecipeProvider } from "@/context/recipe"; 
import RecipeDetailContainer from "@/components/recipe/RecipeDetailContainer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDebugSupabaseData } from "@/utils/debugSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Main exported component wrapped with the RecipeProvider
const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Function to directly check the database
  const checkTikkaMasalaInDatabase = async () => {
    setLoading(true);
    try {
      // First check if we are looking at the right recipe
      if (id) {
        // Get direct data from database for this recipe
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .single();
          
        if (recipeError) {
          throw new Error(`Error fetching recipe: ${recipeError.message}`);
        }
        
        // Get ingredients with detailed food and unit information
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('ingredients')
          .select(`
            id,
            recipe_id,
            food_id,
            unit_id,
            amount,
            foods:food_id(id, name, description),
            units:unit_id(id, name, abbreviation)
          `)
          .eq('recipe_id', id);
          
        if (ingredientsError) {
          throw new Error(`Error fetching ingredients: ${ingredientsError.message}`);
        }
        
        // Additional diagnostics for food data
        const foodIds = ingredientsData
          .filter(ing => ing.food_id)
          .map(ing => ing.food_id);
          
        let foodData = [];
        
        if (foodIds.length > 0) {
          const { data: foods, error: foodsError } = await supabase
            .from('foods')
            .select('*')
            .in('id', foodIds);
            
          if (foodsError) {
            throw new Error(`Error fetching foods: ${foodsError.message}`);
          }
          
          foodData = foods;
        }
        
        // Set comprehensive debug info
        setDebugInfo({
          recipe: recipeData,
          ingredients: ingredientsData,
          foodData
        });
        
        // Fix: Access first ingredient's food and unit correctly
        // Handle the case where the ingredients array might be empty
        let firstIngredientInfo = "None";
        if (ingredientsData.length > 0) {
          const firstIng = ingredientsData[0];
          const foodName = firstIng.foods ? firstIng.foods.name : "None";
          const amount = firstIng.amount || 0;
          const unitAbbr = firstIng.units ? firstIng.units.abbreviation : "";
          
          firstIngredientInfo = `${foodName} - ${amount} ${unitAbbr}`;
        }
        
        setDatabaseStatus(`Recipe in DB: ${recipeData.title}. Found ${ingredientsData.length} ingredients. 
        First ingredient: ${firstIngredientInfo}`);
      }
    } catch (error) {
      console.error("Database check error:", error);
      setDatabaseStatus(`Error checking database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // On component mount, check if we have a query param to find the Tikka Masala recipe
  useEffect(() => {
    if (searchParams.get('findTikka') === 'true') {
      findTikkaMasala();
    }
    
    // Check the database for diagnostic info
    if (id) {
      checkTikkaMasalaInDatabase();
    }
  }, [id, searchParams]);

  const findTikkaMasala = async () => {
    setLoading(true);
    try {
      // Search for Tikka Masala recipe in the database
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title')
        .ilike('title', '%tikka masala%')
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Remove the query param
        searchParams.delete('findTikka');
        setSearchParams(searchParams);
        
        // Navigate to the specific recipe
        if (id !== data[0].id) {
          toast({
            title: "Tikka Masala Recipe Found",
            description: "Navigating to the authentic recipe"
          });
          navigate(`/recipes/${data[0].id}`);
        }
      } else {
        toast({
          title: "Recipe Not Found",
          description: "Could not locate the Tikka Masala recipe",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error finding Tikka Masala:", error);
      toast({
        title: "Error",
        description: "Failed to search for Tikka Masala recipe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecipeProvider>
      {databaseStatus && (
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
                  <p><strong>Ingredients Count:</strong> {debugInfo.ingredients.length}</p>
                  <p><strong>Foods Count:</strong> {debugInfo.foodData.length}</p>
                  <div className="mt-1">
                    <strong>Food IDs:</strong> 
                    <ul className="pl-4">
                      {debugInfo.foodData.map((food: any) => (
                        <li key={food.id}>{food.id.substring(0, 8)}... - {food.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
      <RecipeDetailContainer />
    </RecipeProvider>
  );
};

export default RecipeDetail;
