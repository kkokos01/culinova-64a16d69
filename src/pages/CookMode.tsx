import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { CookSessionProvider } from "@/context/cook/CookSessionContext";
import { useWakeLock } from "@/hooks/useWakeLock";
import { Recipe } from "@/types";
import CookStepAccordion from "@/components/cook/CookStepAccordion";
import TimerWidget from "@/components/cook/TimerWidget";
import IngredientsDrawer from "@/components/cook/IngredientsDrawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChefHat, List } from "lucide-react";
import { recipeService } from "@/services/supabase/recipeService";

const CookMode = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fontSize, setFontSize] = useState<'small' | 'standard' | 'large'>('standard');
  const { requestWakeLock, releaseWakeLock, isSupported, isActive, error: wakeLockError } = useWakeLock();

  // Fetch recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          console.warn("No recipe ID provided to CookMode");
          setRecipe(null);
          setLoading(false);
          return;
        }
        
        console.log("CookMode: Fetching recipe:", id);
        
        // Check if this is an unsaved recipe with data in navigation state
        if (id === "generated" && location.state?.recipe) {
          console.log("CookMode: Using recipe from navigation state");
          setRecipe(location.state.recipe);
          setError(null);
        } else {
          // Fetch from database for saved recipes
          const recipeData = await recipeService.getRecipe(id);
          console.log("CookMode: Fetched recipe from database:", recipeData.title);
          setRecipe(recipeData);
          setError(null);
        }
      } catch (err) {
        console.error("CookMode: Error fetching recipe:", err);
        setError(err as Error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, location.state]);

  // Request wake lock when component mounts and page is visible
  useEffect(() => {
    const requestWakeLockWhenVisible = () => {
      if (document.visibilityState === 'visible' && isSupported) {
        requestWakeLock();
      }
    };

    // Request immediately if visible, otherwise wait for visibility change
    if (document.visibilityState === 'visible') {
      requestWakeLockWhenVisible();
    } else {
      // Listen for visibility change to request wake lock when page becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          requestWakeLockWhenVisible();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // Release wake lock when component unmounts
    return () => {
      releaseWakeLock();
    };
  }, [isSupported, requestWakeLock, releaseWakeLock]);

  // Handle exit from cook mode
  const handleExitCookMode = () => {
    navigate(`/recipes/${id}`);
  };

  // Show loading state while recipe is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto text-blue-600 animate-pulse mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Cook Mode...</h2>
          <p className="text-gray-600">Preparing your recipe for cooking.</p>
        </div>
      </div>
    );
  }

  // Show error state if recipe fetch failed
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Recipe not found</h2>
          <p className="text-gray-600 mb-4">
            {error ? error.message : "We couldn't load this recipe for cooking."}
          </p>
          <Button onClick={handleExitCookMode} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recipe
          </Button>
        </div>
      </div>
    );
  }

  const totalSteps = recipe.steps?.length || 0;

  if (totalSteps === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No cooking steps available</h2>
          <p className="text-gray-600 mb-4">This recipe doesn't have any instructions to follow.</p>
          <Button onClick={handleExitCookMode} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recipe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CookSessionProvider totalSteps={totalSteps}>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Wake Lock Status Banner */}
        {isSupported && !isActive && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <p className="text-sm text-yellow-800">
                Screen may turn off automatically. Wake Lock is not active.
                {wakeLockError && ` Error: ${wakeLockError}`}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={requestWakeLock}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
              >
                Keep Screen On
              </Button>
            </div>
          </div>
        )}

        {!isSupported && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-yellow-800">
                ⚠️ Your browser doesn't support screen wake lock. Please adjust your device settings to keep the screen on while cooking.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">{recipe.title}</h1>
                <p className="text-gray-600 mt-1">Cook Mode</p>
              </div>
              <div className="flex items-center gap-3">
                <IngredientsDrawer>
                  <Button variant="outline" size="lg">
                    <List className="w-5 h-5 mr-2" />
                    Show Ingredients
                  </Button>
                </IngredientsDrawer>
                <Button onClick={handleExitCookMode} variant="outline" size="lg">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Exit
                </Button>
              </div>
            </div>
            
            {/* Font Size Controls */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium text-gray-600 mr-2">Text Size:</span>
              <Button
                onClick={() => setFontSize('small')}
                variant={fontSize === 'small' ? 'default' : 'outline'}
                size="sm"
                className="min-w-[60px]"
              >
                Small
              </Button>
              <Button
                onClick={() => setFontSize('standard')}
                variant={fontSize === 'standard' ? 'default' : 'outline'}
                size="sm"
                className="min-w-[80px]"
              >
                Standard
              </Button>
              <Button
                onClick={() => setFontSize('large')}
                variant={fontSize === 'large' ? 'default' : 'outline'}
                size="sm"
                className="min-w-[60px]"
              >
                Large
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <CookStepAccordion steps={recipe.steps || []} fontSize={fontSize} />
        </main>

        {/* Floating Timer Widget */}
        <TimerWidget />
      </div>
    </CookSessionProvider>
  );
};

export default CookMode;
