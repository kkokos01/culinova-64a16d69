
import { useParams } from "react-router-dom";
import { RecipeProvider } from "@/context/recipe"; 
import RecipeDetailContainer from "@/components/recipe/RecipeDetailContainer";
import RecipeFinder from "@/components/recipe/RecipeFinder";

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <RecipeProvider>
      {/* Component to handle recipe finding by name */}
      <RecipeFinder currentRecipeId={id} />
      
      {/* Main recipe content */}
      <RecipeDetailContainer />
    </RecipeProvider>
  );
};

export default RecipeDetail;
