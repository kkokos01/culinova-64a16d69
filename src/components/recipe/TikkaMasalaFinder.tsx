
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { recipeService } from "@/services/supabase/recipeService";

interface TikkaMasalaFinderProps {
  currentRecipeId: string | undefined;
}

const TikkaMasalaFinder: React.FC<TikkaMasalaFinderProps> = ({ currentRecipeId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  // Check for the 'findTikka' query parameter on component mount
  React.useEffect(() => {
    if (searchParams.get('findTikka') === 'true') {
      findTikkaMasala();
    }
  }, [searchParams]);

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
        if (currentRecipeId !== tikkaMasala.id) {
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

  // This component doesn't render anything visible
  return null;
};

export default TikkaMasalaFinder;
