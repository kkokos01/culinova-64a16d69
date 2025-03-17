
import { useParams } from "react-router-dom";
import { RecipeProvider } from "@/context/recipe"; 
import RecipeDetailContainer from "@/components/recipe/RecipeDetailContainer";
import DatabaseDiagnosticPanel from "@/components/recipe/DatabaseDiagnosticPanel";
import RecipeFinder from "@/components/recipe/RecipeFinder";

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <RecipeProvider>
      {/* Component to handle recipe finding by name */}
      <RecipeFinder currentRecipeId={id} />
      
      {/* Database diagnostic information panel */}
      <DatabaseDiagnosticPanel recipeId={id} />
      
      {/* Main recipe content */}
      <RecipeDetailContainer />
    </RecipeProvider>
  );
};

export default RecipeDetail;
