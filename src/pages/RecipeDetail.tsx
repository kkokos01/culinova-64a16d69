
import { useParams } from "react-router-dom";
import { RecipeProvider } from "@/context/recipe"; 
import RecipeDetailContainer from "@/components/recipe/RecipeDetailContainer";
import RecipeFinder from "@/components/recipe/RecipeFinder";
import Navbar from "@/components/Navbar";

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <RecipeProvider>
      {/* Consistent Navbar */}
      <Navbar />
      
      {/* Main content with padding for fixed navbar */}
      <div className="pt-16">
        {/* Component to handle recipe finding by name */}
        <RecipeFinder currentRecipeId={id} />
        
        {/* Main recipe content */}
        <RecipeDetailContainer />
      </div>
    </RecipeProvider>
  );
};

export default RecipeDetail;
