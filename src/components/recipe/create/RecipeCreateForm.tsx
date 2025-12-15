import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { recipeService } from "@/services/supabase/recipeService";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChefHat, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIRecipeResponse } from "@/services/ai/recipeGenerator";

interface RecipeFormData {
  title: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_public: boolean;
  privacy_level: 'private' | 'space' | 'public' | 'shared';
  tags: string[];
  ingredients: Array<{
    food_id?: string | null;
    unit_id?: string | null;
    food_name: string;
    unit_name: string;
    amount: number;
  }>;
  steps: Array<{
    order_number: number;
    instruction: string;
    duration_minutes?: number;
  }>;
  source_url: string;
}

interface RecipeCreateFormProps {
  initialData?: AIRecipeResponse;
}

const RecipeCreateForm: React.FC<RecipeCreateFormProps> = ({ initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();

  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    prep_time_minutes: 15,
    cook_time_minutes: 30,
    servings: 4,
    difficulty: "medium",
    is_public: false,
    privacy_level: "private",
    tags: [],
    ingredients: [],
    steps: [],
    source_url: "",
  });

  // Hydrate form with initial data from import
  useEffect(() => {
    if (initialData) {
      console.log("Hydrating form with imported data:", initialData);
      
      setFormData(prev => ({
        ...prev,
        title: initialData.title || "",
        description: initialData.description || "",
        prep_time_minutes: initialData.prepTimeMinutes || 15,
        cook_time_minutes: initialData.cookTimeMinutes || 30,
        servings: initialData.servings || 4,
        difficulty: initialData.difficulty || "medium",
        tags: initialData.tags || [],
        ingredients: (initialData.ingredients || []).map(ing => ({
          food_name: ing.name || "",
          unit_name: ing.unit || "",
          amount: parseFloat(ing.amount) || 0,
          food_id: null,
          unit_id: null
        })),
        steps: (initialData.steps || []).map((step, index) => ({
          order_number: index + 1,
          instruction: step,
          duration_minutes: undefined
        })),
        source_url: initialData.sourceUrl || ""
      }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof RecipeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, {
        food_name: "",
        unit_name: "",
        amount: 1,
        food_id: null,
        unit_id: null
      }]
    }));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        order_number: prev.steps.length + 1,
        instruction: ""
      }]
    }));
  };

  const updateStep = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        order_number: i + 1
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error("You must be logged in to create a recipe");
      }

      // Basic validation
      if (!formData.title.trim()) {
        throw new Error("Recipe title is required");
      }

      if (!formData.description.trim()) {
        throw new Error("Recipe description is required");
      }

      if (formData.ingredients.length === 0) {
        throw new Error("At least one ingredient is required");
      }

      if (formData.steps.length === 0) {
        throw new Error("At least one step is required");
      }

      // Validate ingredients
      for (const ingredient of formData.ingredients) {
        if (!ingredient.food_name || ingredient.amount <= 0) {
          throw new Error("All ingredients must have a name and amount");
        }
      }

      // Validate steps
      for (const step of formData.steps) {
        if (!step.instruction.trim()) {
          throw new Error("All steps must have instructions");
        }
      }

      const recipeData = {
        ...formData,
        user_id: user.id,
        user_name: user?.user_metadata?.name || user?.email || 'User', // Add user name for activity logging
        space_id: currentSpace?.id || null,
      };

      const createdRecipe = await recipeService.createRecipe(recipeData);

      toast({
        title: "Recipe created successfully!",
        description: `"${createdRecipe.title}" has been added to your recipes.`,
      });

      // Navigate to the newly created recipe
      navigate(`/recipes/${createdRecipe.id}`);

    } catch (error: any) {
      console.error("Error creating recipe:", error);
      toast({
        title: "Error creating recipe",
        description: error.message || "Failed to create recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChefHat className="mr-2 h-6 w-6" />
            Create New Recipe
          </CardTitle>
          <CardDescription>
            Add a new recipe to your collection. Fill in the details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter recipe title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your recipe..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="source_url">Source URL</Label>
                <Input
                  id="source_url"
                  value={formData.source_url}
                  onChange={(e) => handleInputChange("source_url", e.target.value)}
                  placeholder="https://example.com/recipe"
                  className="text-blue-600 underline-offset-4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="prep_time">Prep Time (minutes)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    min="0"
                    value={formData.prep_time_minutes}
                    onChange={(e) => handleInputChange("prep_time_minutes", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="cook_time">Cook Time (minutes)</Label>
                  <Input
                    id="cook_time"
                    type="number"
                    min="0"
                    value={formData.cook_time_minutes}
                    onChange={(e) => handleInputChange("cook_time_minutes", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={formData.servings}
                    onChange={(e) => handleInputChange("servings", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => handleInputChange("difficulty", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="privacy">Privacy Level</Label>
                  <Select
                    value={formData.privacy_level}
                    onValueChange={(value: 'private' | 'space' | 'public' | 'shared') => handleInputChange("privacy_level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="space">Space</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ingredients</h3>
                <Button type="button" onClick={addIngredient} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>

              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Ingredient name"
                    value={ingredient.food_name}
                    onChange={(e) => updateIngredient(index, "food_name", e.target.value)}
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={ingredient.amount}
                    onChange={(e) => updateIngredient(index, "amount", parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    placeholder="Unit"
                    value={ingredient.unit_name}
                    onChange={(e) => updateIngredient(index, "unit_name", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {formData.ingredients.length === 0 && (
                <p className="text-gray-500 italic">No ingredients added yet. Click "Add Ingredient" to get started.</p>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Instructions</h3>
                <Button type="button" onClick={addStep} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {formData.steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">Step {step.order_number}</Label>
                    <Button
                      type="button"
                      onClick={() => removeStep(index)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={step.instruction}
                    onChange={(e) => updateStep(index, "instruction", e.target.value)}
                    placeholder="Describe this step..."
                    rows={2}
                  />
                  <Input
                    type="number"
                    placeholder="Duration (minutes, optional)"
                    min="0"
                    value={step.duration_minutes || ""}
                    onChange={(e) => updateStep(index, "duration_minutes", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              ))}

              {formData.steps.length === 0 && (
                <p className="text-gray-500 italic">No steps added yet. Click "Add Step" to get started.</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Recipe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipeCreateForm;
