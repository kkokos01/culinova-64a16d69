
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
        
        // Get ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('ingredients')
          .select(`
            *,
            food:food_id(id, name, description),
            unit:unit_id(id, name, abbreviation)
          `)
          .eq('recipe_id', id);
          
        if (ingredientsError) {
          throw new Error(`Error fetching ingredients: ${ingredientsError.message}`);
        }
        
        setDatabaseStatus(`Recipe in DB: ${recipeData.title}. Found ${ingredientsData.length} ingredients. 
        First ingredient: ${ingredientsData[0]?.food?.name || 'None'} - ${ingredientsData[0]?.amount || 0} ${ingredientsData[0]?.unit?.abbreviation || ''}`);
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
        </div>
      )}
      <RecipeDetailContainer />
    </RecipeProvider>
  );
};

export default RecipeDetail;
