
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Space, UserSpace } from "@/types";

type SpacesListProps = {
  userId: string;
  spaces: Space[];
  memberships: UserSpace[];
  refreshSpaces: () => Promise<void>;
};

const SpacesList = ({ userId, spaces, memberships, refreshSpaces }: SpacesListProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createNewSpace = async () => {
    try {
      const spaceName = prompt("Enter a name for your new space:");
      if (!spaceName) return;

      setIsLoading(true);
      
      // Insert the new space
      const { data: spaceData, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name: spaceName,
          created_by: userId,
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Refresh the spaces list
      await refreshSpaces();
      
      toast({
        title: "Space created",
        description: `"${spaceName}" has been created successfully.`,
      });
    } catch (error: any) {
      console.error("Error creating space:", error);
      toast({
        title: "Error creating space",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Spaces</CardTitle>
          <CardDescription>
            Manage your recipe collections
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={createNewSpace} 
          disabled={isLoading}
        >
          Create Space
        </Button>
      </CardHeader>
      <CardContent>
        {spaces.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            You don't have any spaces yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {spaces.map((space) => {
              const membership = memberships.find(m => m.space_id === space.id);
              return (
                <Card key={space.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{space.name}</CardTitle>
                      <span className="text-sm px-2 py-1 bg-slate-100 rounded-md capitalize">
                        {membership?.role || 'member'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-500">
                      <p>Members: {space.max_users === 0 ? "Unlimited" : space.max_users}</p>
                      <p>Recipes: {space.max_recipes === 0 ? "Unlimited" : space.max_recipes}</p>
                      <p>Created: {new Date(space.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">View Recipes</Button>
                      {membership?.role === 'admin' && (
                        <Button size="sm" variant="outline">Manage</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpacesList;
