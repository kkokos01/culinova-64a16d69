import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, X } from 'lucide-react';
import { recipeService } from '@/services/supabase/recipeService';
import { useAuth } from '@/context/AuthContext';
import { useSpace } from '@/context/SpaceContext';
import { useToast } from '@/hooks/use-toast';
import { FEATURES } from '@/config/features';
import { supabase } from '@/integrations/supabase/client';

interface RecipeActionsProps {
  recipeId: string;
  recipeOwnerId: string;
  currentSpaceId?: string;
  isEditorOrAdmin?: boolean;
  onRecipeRemoved?: () => void;
  onRecipeDeleted?: () => void;
}

export const RecipeActions: React.FC<RecipeActionsProps> = ({
  recipeId,
  recipeOwnerId,
  currentSpaceId,
  isEditorOrAdmin = false,
  onRecipeRemoved,
  onRecipeDeleted
}) => {
  const { user } = useAuth();
  const { spaces } = useSpace();
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recipeSpaces, setRecipeSpaces] = useState<Array<{id: string, name: string}>>([]);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  const isOwner = user?.id === recipeOwnerId;

  // Fetch all spaces this recipe is in
  useEffect(() => {
    const fetchRecipeSpaces = async () => {
      if (!user || !FEATURES.SPACE_RECIPES) return;
      
      setIsLoadingSpaces(true);
      try {
        const { data, error } = await supabase
          .from('space_recipes')
          .select('spaces(id, name)')
          .eq('recipe_id', recipeId)
          .eq('added_by', user.id);
        
        if (!error && data) {
          const spaceList = data.map((item: any) => item.spaces).filter(Boolean);
          setRecipeSpaces(spaceList);
        }
      } catch (error) {
        console.error('Error fetching recipe spaces:', error);
      } finally {
        setIsLoadingSpaces(false);
      }
    };

    fetchRecipeSpaces();
  }, [recipeId, user]);

  const handleRemoveFromSpaces = async () => {
    if (selectedSpaces.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one collection",
        variant: "destructive"
      });
      return;
    }

    setIsRemoving(true);
    try {
      // Remove from all selected spaces
      await Promise.all(
        selectedSpaces.map(spaceId => 
          recipeService.removeRecipeFromSpace(recipeId, spaceId)
        )
      );
      
      toast({
        title: "Recipe removed",
        description: `Recipe has been removed from ${selectedSpaces.length} collection${selectedSpaces.length > 1 ? 's' : ''}`
      });
      onRecipeRemoved?.();
      
      // Refresh the spaces list
      const { data, error } = await supabase
        .from('space_recipes')
        .select('spaces(id, name)')
        .eq('recipe_id', recipeId)
        .eq('added_by', user!.id);
      
      if (!error && data) {
        const spaceList = data.map((item: any) => item.spaces).filter(Boolean);
        setRecipeSpaces(spaceList);
        setSelectedSpaces([]);
      }
    } catch (error: any) {
      toast({
        title: "Failed to remove recipe",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Call the Edge Function for secure deletion
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-recipe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ recipeId })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete recipe');
      }

      const result = await response.json();
      
      toast({
        title: result.deleted ? "Recipe deleted" : "Recipe removed",
        description: result.message
      });
      
      if (result.deleted) {
        onRecipeDeleted?.();
      } else {
        onRecipeRemoved?.();
      }
    } catch (error: any) {
      toast({
        title: "Failed to delete recipe",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Remove from Collection Button */}
      {FEATURES.SPACE_RECIPES && isEditorOrAdmin && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isRemoving || isLoadingSpaces}
            >
              <X className="h-4 w-4 mr-2" />
              {isRemoving ? 'Removing...' : 'Remove from Collection'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Collections</AlertDialogTitle>
              <AlertDialogDescription>
                Select which collections to remove this recipe from. The recipe will still be available in other collections.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 max-h-60 overflow-y-auto">
              {isLoadingSpaces ? (
                <div className="text-sm text-muted-foreground">Loading collections...</div>
              ) : recipeSpaces.length === 0 ? (
                <div className="text-sm text-muted-foreground">This recipe is not in any of your collections</div>
              ) : (
                <div className="space-y-2">
                  {recipeSpaces.map((space) => (
                    <div key={space.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={space.id}
                        checked={selectedSpaces.includes(space.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSpaces([...selectedSpaces, space.id]);
                          } else {
                            setSelectedSpaces(selectedSpaces.filter(id => id !== space.id));
                          }
                        }}
                      />
                      <label 
                        htmlFor={space.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {space.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRemoveFromSpaces}
                disabled={selectedSpaces.length === 0 || isRemoving}
              >
                Remove from {selectedSpaces.length} {selectedSpaces.length === 1 ? 'Collection' : 'Collections'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Recipe Button - Owner Only */}
      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              size="sm"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Recipe'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this recipe permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The recipe will be permanently deleted from all collections, along with all its ingredients and steps.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRecipe} className="bg-red-600 hover:bg-red-700">
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
