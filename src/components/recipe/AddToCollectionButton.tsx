import React, { useState } from "react";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, FolderOpen, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddToCollectionButtonProps {
  recipeId: string;
  currentSpaceId?: string;
  onCollectionChange?: (newSpaceId: string) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function AddToCollectionButton({ 
  recipeId, 
  currentSpaceId, 
  onCollectionChange,
  variant = "outline",
  size = "default"
}: AddToCollectionButtonProps) {
  const { spaces } = useSpace();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCollectionChange = async (spaceId: string) => {
    if (spaceId === currentSpaceId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .update({ space_id: spaceId })
        .eq("id", recipeId);

      if (error) throw error;

      toast({
        title: "Recipe moved to collection",
        description: `Recipe has been moved to "${spaces.find(s => s.id === spaceId)?.name}"`,
      });

      if (onCollectionChange) {
        onCollectionChange(spaceId);
      }
    } catch (error) {
      console.error("Error moving recipe to collection:", error);
      toast({
        title: "Error moving recipe",
        description: "Failed to move recipe to collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentCollectionName = () => {
    if (!currentSpaceId) return "No collection";
    return spaces.find(s => s.id === currentSpaceId)?.name || "Unknown collection";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add to Collection +
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {spaces.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-gray-500">
            No collections available
          </div>
        ) : (
          spaces.map((space) => (
            <DropdownMenuItem
              key={space.id}
              onClick={() => handleCollectionChange(space.id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <FolderOpen className="h-4 w-4 mr-2 text-gray-500" />
                <span>{space.name}</span>
              </div>
              {space.id === currentSpaceId && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
