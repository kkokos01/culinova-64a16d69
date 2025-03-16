
import { useState, useEffect } from "react";
import { Recipe } from "@/types";
import { RecipeVersion } from "./types";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRecipeVersions(setRecipe: (recipe: Recipe) => void) {
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
  const [hasInitializedVersions, setHasInitializedVersions] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const { toast } = useToast();

  // Calculate active version ID from the versions array
  const activeVersionId = recipeVersions.find(v => v.isActive)?.id || "";

  // Fetch versions from the database for a specific recipe
  const fetchVersionsFromDb = async (recipeId: string) => {
    if (!recipeId) return;
    
    setIsLoadingVersions(true);
    
    try {
      // First fetch the original recipe to ensure we have all details
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();
      
      if (recipeError) throw recipeError;
      
      if (!recipeData) {
        throw new Error("Recipe not found");
      }
      
      // Get versions for this recipe
      const { data: dbVersions, error } = await supabase
        .from('recipe_versions')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('version_number', { ascending: true });
      
      if (error) throw error;
      
      if (dbVersions && dbVersions.length > 0) {
        // Convert to our frontend version format
        const versions: RecipeVersion[] = await Promise.all(dbVersions.map(async (dbVersion) => {
          // Fetch ingredients for this version
          const { data: ingredients, error: ingredientsError } = await supabase
            .from('recipe_version_ingredients')
            .select(`
              id, amount, order_index,
              food:food_id(id, name, description, category_id, properties),
              unit:unit_id(id, name, abbreviation, plural_name)
            `)
            .eq('version_id', dbVersion.id);
          
          if (ingredientsError) throw ingredientsError;
          
          // Fetch steps for this version
          const { data: steps, error: stepsError } = await supabase
            .from('recipe_version_steps')
            .select('*')
            .eq('version_id', dbVersion.id)
            .order('order_number', { ascending: true });
          
          if (stepsError) throw stepsError;
          
          // Create recipe object for this version - using original recipe data as the base
          const versionRecipe: Recipe = {
            ...recipeData,
            ingredients: ingredients?.map(ing => ({
              id: ing.id,
              // Fix: The food and unit are individual objects, not arrays
              food_id: ing.food ? ing.food.id : '',
              unit_id: ing.unit ? ing.unit.id : '',
              amount: ing.amount,
              food: ing.food || undefined,
              unit: ing.unit || undefined
            })) || [],
            steps: steps || []
          };
          
          return {
            id: dbVersion.id,
            name: dbVersion.display_name,
            recipe: versionRecipe,
            isActive: dbVersion.is_current
          };
        }));
        
        setRecipeVersions(versions);
        
        // Set active recipe if there's an active version
        const activeVersion = versions.find(v => v.isActive);
        if (activeVersion) {
          setRecipe(activeVersion.recipe);
        }
      } else {
        // If no versions exist yet, we'll create the Original version in the parent component
        setRecipeVersions([]);
      }
    } catch (error: any) {
      console.error('Error fetching recipe versions:', error.message);
      toast({
        title: "Error loading recipe versions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Add a new recipe version to the database
  const addRecipeVersion = async (name: string, recipe: Recipe) => {
    if (!recipe || !recipe.id) {
      console.error("Cannot create version: Recipe is undefined or missing ID");
      return;
    }
    
    try {
      // Check if version with this name already exists
      const versionExists = recipeVersions.some(v => v.name === name);
      
      // If it's the "Original" version and we already have it, don't create another one
      if (name === "Original" && versionExists) {
        // Just make sure Original is active if that's what we want
        setActiveVersion(recipeVersions.find(v => v.name === "Original")?.id || "");
        return;
      }
      
      // Calculate next version number
      const nextVersionNumber = recipeVersions.length > 0 
        ? Math.max(...recipeVersions.map(v => parseInt(v.id.split('-')[0]) || 0)) + 1 
        : 1;
      
      // For non-Original versions or if Original doesn't exist yet
      // Create new version in the database
      const { data: newDbVersion, error } = await supabase
        .from('recipe_versions')
        .insert({
          recipe_id: recipe.id,
          version_number: nextVersionNumber,
          display_name: versionExists ? `${name} (${new Date().toLocaleTimeString()})` : name,
          modification_type: 'manual',
          is_current: true,
          created_by: recipe.user_id // This should be the current user's ID
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (!newDbVersion) {
        throw new Error("Failed to create new version");
      }
      
      // Create ingredients for the new version
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const versionIngredients = recipe.ingredients.map((ing, index) => ({
          version_id: newDbVersion.id,
          // Fix: Properly handle potentially undefined food and unit objects
          food_id: ing.food?.id || ing.food_id,
          unit_id: ing.unit?.id || ing.unit_id,
          amount: ing.amount,
          order_index: index
        }));
        
        const { error: ingredientsError } = await supabase
          .from('recipe_version_ingredients')
          .insert(versionIngredients);
        
        if (ingredientsError) throw ingredientsError;
      }
      
      // Create steps for the new version
      if (recipe.steps && recipe.steps.length > 0) {
        const versionSteps = recipe.steps.map(step => ({
          version_id: newDbVersion.id,
          order_number: step.order_number,
          instruction: step.instruction,
          duration_minutes: step.duration_minutes
        }));
        
        const { error: stepsError } = await supabase
          .from('recipe_version_steps')
          .insert(versionSteps);
        
        if (stepsError) throw stepsError;
      }
      
      // Deactivate all other versions
      await supabase
        .from('recipe_versions')
        .update({ is_current: false })
        .eq('recipe_id', recipe.id)
        .neq('id', newDbVersion.id);
      
      // Create a complete recipe object for the new version
      const newVersionRecipe: Recipe = {
        ...recipe
      };
      
      // Create the new version object
      const newVersion: RecipeVersion = {
        id: newDbVersion.id,
        name: newDbVersion.display_name,
        recipe: newVersionRecipe,
        isActive: true
      };
      
      // Update local versions state
      setRecipeVersions(prev => {
        // Deactivate all existing versions
        const updatedVersions = prev.map(version => ({
          ...version,
          isActive: false
        }));
        
        return [...updatedVersions, newVersion];
      });
      
      // Set the newly created version as the active recipe
      setRecipe(newVersionRecipe);
      
    } catch (error: any) {
      console.error('Error creating recipe version:', error.message);
      toast({
        title: "Error creating version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Set active version
  const setActiveVersion = async (versionId: string) => {
    try {
      // Update database first
      const { error } = await supabase
        .from('recipe_versions')
        .update({ is_current: true })
        .eq('id', versionId);
      
      if (error) throw error;
      
      // Get the recipe for this version ID
      const versionToActivate = recipeVersions.find(v => v.id === versionId);
      
      if (versionToActivate) {
        // Update recipe in the parent component
        setRecipe(versionToActivate.recipe);
        
        // Deactivate other versions in the database
        const { error: otherVersionsError } = await supabase
          .from('recipe_versions')
          .update({ is_current: false })
          .eq('recipe_id', versionToActivate.recipe.id)
          .neq('id', versionId);
        
        if (otherVersionsError) throw otherVersionsError;
      }
      
      // Update local state
      setRecipeVersions(prev => 
        prev.map(version => ({
          ...version,
          isActive: version.id === versionId
        }))
      );
    } catch (error: any) {
      console.error('Error setting active version:', error.message);
      toast({
        title: "Error activating version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Rename version
  const renameVersion = async (versionId: string, newName: string) => {
    try {
      // Don't allow renaming Original
      const originalVersion = recipeVersions.find(v => v.name === "Original");
      if (originalVersion && originalVersion.id === versionId && newName !== "Original") {
        return;
      }
      
      // Update in database
      const { error } = await supabase
        .from('recipe_versions')
        .update({ display_name: newName })
        .eq('id', versionId);
      
      if (error) throw error;
      
      // Update local state
      setRecipeVersions(prev => 
        prev.map(version => 
          version.id === versionId 
            ? { ...version, name: newName } 
            : version
        )
      );
    } catch (error: any) {
      console.error('Error renaming version:', error.message);
      toast({
        title: "Error renaming version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Delete version
  const deleteVersion = async (versionId: string) => {
    try {
      // Don't allow deleting Original
      const originalVersion = recipeVersions.find(v => v.name === "Original");
      if (originalVersion && originalVersion.id === versionId) {
        toast({
          title: "Cannot delete Original version",
          description: "The Original version cannot be deleted.",
          variant: "destructive"
        });
        return;
      }
      
      // Find if the version being deleted is active
      const isActiveVersion = recipeVersions.find(v => v.id === versionId)?.isActive || false;
      
      // Delete from database - cascade will handle related records
      const { error } = await supabase
        .from('recipe_versions')
        .delete()
        .eq('id', versionId);
      
      if (error) throw error;
      
      // Filter out the version to delete
      const remainingVersions = recipeVersions.filter(version => version.id !== versionId);
      
      // If we deleted the active version, make the first remaining version active
      if (isActiveVersion && remainingVersions.length > 0) {
        await setActiveVersion(remainingVersions[0].id);
      }
      
      // Update local state
      setRecipeVersions(remainingVersions);
    } catch (error: any) {
      console.error('Error deleting version:', error.message);
      toast({
        title: "Error deleting version",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    recipeVersions,
    activeVersionId,
    hasInitializedVersions,
    setHasInitializedVersions,
    isLoadingVersions,
    fetchVersionsFromDb,
    addRecipeVersion,
    setActiveVersion,
    renameVersion,
    deleteVersion
  };
}
