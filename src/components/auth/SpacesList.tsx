
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Space, UserSpace } from "@/types";
import { useSpace } from "@/context/SpaceContext";
import { PlusCircle, Settings, Share2, Trash2, Users } from "lucide-react";

type SpacesListProps = {
  userId: string;
  spaces: Space[];
  memberships: UserSpace[];
  refreshSpaces: () => Promise<void>;
};

const SpacesList = ({ userId, spaces, memberships, refreshSpaces }: SpacesListProps) => {
  const { toast } = useToast();
  const { currentSpace, setCurrentSpace } = useSpace();
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
          max_recipes: 0, // Unlimited
          max_users: 5,  // Default to 5 users
          is_active: true
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Create a membership for the creator as admin
      if (spaceData) {
        const { error: membershipError } = await supabase
          .from("user_spaces")
          .insert({
            user_id: userId,
            space_id: spaceData.id,
            role: 'admin',
            is_active: true
          });

        if (membershipError) throw membershipError;
      }

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

  const selectSpace = (space: Space) => {
    setCurrentSpace(space);
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
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Space
        </Button>
      </CardHeader>
      <CardContent>
        {spaces.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="mb-4">You don't have any spaces yet. Create one to get started!</p>
            <Button onClick={createNewSpace} disabled={isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Space
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {spaces.map((space) => {
              const membership = memberships.find(m => m.space_id === space.id);
              const isActive = currentSpace?.id === space.id;
              
              return (
                <Card 
                  key={space.id} 
                  className={`${isActive ? 'border-primary' : ''} transition-all`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">{space.name}</CardTitle>
                      <Badge variant={isActive ? "default" : "outline"} className="capitalize">
                        {membership?.role || 'member'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm text-slate-500 grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Members: {space.max_users === 0 ? "Unlimited" : space.max_users}</span>
                      </div>
                      <div>
                        Created: {new Date(space.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button 
                      size="sm" 
                      variant={isActive ? "default" : "outline"}
                      onClick={() => selectSpace(space)}
                    >
                      {isActive ? "Current Space" : "Select Space"}
                    </Button>
                    
                    <div className="flex space-x-2">
                      {membership?.role === 'admin' && (
                        <>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardFooter>
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
