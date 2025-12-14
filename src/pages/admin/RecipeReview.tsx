import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, Check, X, Clock, AlertTriangle, User, Calendar, ChefHat } from "lucide-react";
import { Recipe } from "@/types";

interface RecipeWithDetails extends Recipe {
  qa_status: string;
  uploader_name?: string;
  uploader_avatar?: string;
  space_name?: string;
  approver_name?: string;
}

const RecipeReview: React.FC = () => {
  const { user } = useAuth();
  const { memberships, isLoading: spacesLoading } = useSpace();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithDetails | null>(null);

  // Check if user is admin of any space
  const isAdmin = memberships.some(m => m.role === 'admin' && m.is_active);

  useEffect(() => {
    if (!spacesLoading && (!user || !isAdmin)) {
      navigate("/");
      return;
    }
    if (user && isAdmin) {
      fetchPendingRecipes();
    }
  }, [user, isAdmin, navigate, spacesLoading]);

  const fetchPendingRecipes = async () => {
    try {
      // Use separate queries to avoid foreign key issues
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select<'*', any>('*')
        .in('qa_status', ['pending', 'flag'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!recipes || recipes.length === 0) {
        setRecipes([]);
        return;
      }

      // Fetch user profiles for all recipes
      const userIds = [...new Set(recipes.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // Fetch spaces for all recipes
      const spaceIds = [...new Set(recipes.map(r => r.space_id).filter(Boolean))];
      const { data: spaces } = await supabase
        .from('spaces')
        .select('id, name')
        .in('id', spaceIds as string[]);
      
      // Transform the data to match our interface
      const transformedData = recipes.map((recipe: any) => ({
        ...recipe,
        uploader_name: profiles?.find(p => p.user_id === recipe.user_id)?.display_name,
        uploader_avatar: profiles?.find(p => p.user_id === recipe.user_id)?.avatar_url,
        space_name: spaces?.find(s => s.id === recipe.space_id)?.name
      }));
      
      setRecipes(transformedData);
    } catch (error: any) {
      console.error("Error fetching pending recipes:", error);
      toast({
        title: "Error",
        description: "Failed to load pending recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recipeId: string) => {
    if (!user) return;
    
    setReviewing(recipeId);
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ 
          qa_status: 'approved_public',
          is_public: true,
          privacy_level: 'public',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', recipeId);

      if (error) throw error;

      // Remove from list
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      
      toast({
        title: "Recipe Approved",
        description: "Recipe is now visible in public collections",
      });
    } catch (error: any) {
      console.error("Error approving recipe:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve recipe",
        variant: "destructive",
      });
    } finally {
      setReviewing(null);
    }
  };

  const handleReject = async (recipeId: string) => {
    if (!user) return;
    
    const feedbackText = feedback[recipeId];
    if (!feedbackText || !feedbackText.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback when rejecting a recipe",
        variant: "destructive",
      });
      return;
    }

    setReviewing(recipeId);
    try {
      const currentRecipe = recipes.find(r => r.id === recipeId);
      const { error } = await supabase
        .from('recipes')
        .update({ 
          qa_status: 'rejected_public',
          description: `REJECTED: ${feedbackText.trim()}\n\n${currentRecipe?.description || ""}`,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', recipeId);

      if (error) throw error;

      // Remove from list
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      
      toast({
        title: "Recipe Rejected",
        description: "Recipe has been rejected with feedback",
      });
    } catch (error: any) {
      console.error("Error rejecting recipe:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject recipe",
        variant: "destructive",
      });
    } finally {
      setReviewing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "flag":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "flag":
        return "destructive";
      default:
        return "default";
    }
  };

  if (spacesLoading || loading) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading pending recipes...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need to be a space admin to review recipes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Review</h1>
          <p className="text-gray-600">
            Review and approve recipes for public visibility
          </p>
        </div>

        {recipes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No recipes pending review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="max-w-4xl">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{recipe.title}</CardTitle>
                        <Badge variant={getStatusColor(recipe.qa_status)} className="flex items-center gap-1">
                          {getStatusIcon(recipe.qa_status)}
                          {recipe.qa_status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {recipe.uploader_name || "Unknown"}
                        </span>
                        {recipe.space_name && (
                          <span className="flex items-center gap-1">
                            <ChefHat className="h-4 w-4" />
                            {recipe.space_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(recipe.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecipe(recipe)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Recipe Summary */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Prep time:</span> {recipe.prep_time_minutes}m
                      </div>
                      <div>
                        <span className="font-medium">Cook time:</span> {recipe.cook_time_minutes}m
                      </div>
                      <div>
                        <span className="font-medium">Servings:</span> {recipe.servings}
                      </div>
                      <div>
                        <span className="font-medium">Difficulty:</span> {recipe.difficulty}
                      </div>
                    </div>

                    {/* Description */}
                    {recipe.description && (
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {recipe.description}
                        </p>
                      </div>
                    )}

                    {/* Feedback for rejection */}
                    <div>
                      <h4 className="font-medium mb-2">Review Feedback</h4>
                      <Textarea
                        placeholder="Provide feedback for rejection (required when rejecting)..."
                        value={feedback[recipe.id] || ""}
                        onChange={(e) => setFeedback(prev => ({ 
                          ...prev, 
                          [recipe.id]: e.target.value 
                        }))}
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleApprove(recipe.id)}
                        disabled={reviewing === recipe.id}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Approve for Public
                        {reviewing === recipe.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(recipe.id)}
                        disabled={reviewing === recipe.id}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject
                        {reviewing === recipe.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recipe Preview Modal */}
        {selectedRecipe && (
          <RecipePreviewModal
            recipe={selectedRecipe}
            isOpen={!!selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </div>
    </div>
  );
};

// Recipe Preview Modal Component
const RecipePreviewModal: React.FC<{
  recipe: RecipeWithDetails;
  isOpen: boolean;
  onClose: () => void;
}> = ({ recipe, isOpen, onClose }) => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && recipe) {
      fetchRecipeDetails();
    }
  }, [isOpen, recipe]);

  const fetchRecipeDetails = async () => {
    try {
      const [ingredientsRes, stepsRes] = await Promise.all([
        supabase.from('ingredients').select('*').eq('recipe_id', recipe.id),
        supabase.from('steps').select('*').eq('recipe_id', recipe.id).order('order_number')
      ]);

      setIngredients(ingredientsRes.data || []);
      setSteps(stepsRes.data || []);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{recipe.title}</h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
                <ul className="list-disc list-inside space-y-1">
                  {ingredients.map((ing, idx) => (
                    <li key={idx} className="text-sm">
                      {ing.amount} {ing.unit_name} {ing.food_name}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Steps */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-sm">{step.instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeReview;
