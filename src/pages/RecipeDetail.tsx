
import { useEffect, useState } from "react";
import { RecipeProvider } from "@/context/recipe"; 
import RecipeDetailContainer from "@/components/recipe/RecipeDetailContainer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { recipeService } from "@/services/supabase/recipeService";

// Define types for the ingredients data returned from Supabase
interface IngredientData {
  id: string;
  recipe_id: string;
  food_id: string;
  unit_id: string;
  amount: number;
  // Use singular field names to match our type expectations
  food: {
    id: string;
    name: string;
    description: string;
  };
  unit: {
    id: string;
    name: string;
    abbreviation: string;
  };
}

// Main exported component wrapped with the RecipeProvider
const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Function to directly check the database using proper naming
  const checkRecipeInDatabase = async () => {
    setLoading(true);
    try {
      // First check if we are looking at the right recipe
      if (id) {
        // Use our service instead of direct queries
        const recipeData = await recipeService.getRecipe(id);
        
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
          .eq('recipe_id', id);
          
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
          const firstIng = ingredientsData[0] as IngredientData;
          const foodName = firstIng.food ? firstIng.food.name : "None";
          const amount = firstIng.amount || 0;
          const unitAbbr = firstIng.unit ? firstIng.unit.abbreviation : "";
          
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

  // On component mount, check if we have a query param to find the Tikka Masala recipe
  useEffect(() => {
    if (searchParams.get('findTikka') === 'true') {
      findTikkaMasala();
    }
    
    // Check the database for diagnostic info
    if (id) {
      checkRecipeInDatabase();
    }
  }, [id, searchParams]);

  const findTikkaMasala = async () => {
    setLoading(true);
    try {
      // Use our service to find the recipe
      const tikkaMasala = await recipeService.findRecipeByName('tikka masala');
      
      if (tikkaMasala) {
        // Remove the query param
        searchParams.delete('findTikka');
        setSearchParams(searchParams);
        
        // Navigate to the specific recipe
        if (id !== tikkaMasala.id) {
          toast({
            title: "Tikka Masala Recipe Found",
            description: "Navigating to the authentic recipe"
          });
          navigate(`/recipes/${tikkaMasala.id}`);
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
                  <p><strong>Ingredients Count:</strong> {debugInfo.ingredients?.length || 0}</p>
                  <div className="mt-1">
                    <strong>Ingredients:</strong> 
                    <ul className="pl-4">
                      {debugInfo.ingredients?.map((ing: any) => (
                        <li key={ing.id}>
                          {ing.food?.name || 'Unknown'} - {ing.amount} {ing.unit?.abbreviation || ''}
                        </li>
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
