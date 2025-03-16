
import { useEffect, useState } from "react";
import { RecipeProvider } from "@/context/recipe"; 
import RecipeDetailContainer from "@/components/recipe/RecipeDetailContainer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDebugSupabaseData } from "@/utils/debugSupabaseData";
import { useToast } from "@/hooks/use-toast";

// Main exported component wrapped with the RecipeProvider
const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { findTikkaMasalaRecipe } = useDebugSupabaseData();
  const [loading, setLoading] = useState(false);

  // On component mount, check if we're looking for Tikka Masala
  useEffect(() => {
    const findTikkaMasala = async () => {
      // Only look for Tikka Masala if the findTikka param is set
      if (searchParams.get('findTikka') === 'true') {
        setLoading(true);
        try {
          // Find and navigate to the Tikka Masala recipe
          const tikkaData = await findTikkaMasalaRecipe();
          
          if (tikkaData && tikkaData.recipe) {
            // Remove the query param
            searchParams.delete('findTikka');
            setSearchParams(searchParams);
            
            // Navigate to the specific recipe
            if (id !== tikkaData.recipe.id) {
              toast({
                title: "Tikka Masala Recipe Found",
                description: "Navigating to the authentic recipe"
              });
              navigate(`/recipes/${tikkaData.recipe.id}`);
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
        } finally {
          setLoading(false);
        }
      }
    };
    
    findTikkaMasala();
  }, [id, searchParams, setSearchParams, navigate, findTikkaMasalaRecipe, toast]);

  return (
    <RecipeProvider>
      <RecipeDetailContainer />
    </RecipeProvider>
  );
};

export default RecipeDetail;
