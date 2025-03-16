
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";

export const useSeedRecipes = () => {
  const { user } = useAuth();
  const { currentSpace, refreshSpaces } = useSpace();
  const { toast } = useToast();

  const seedRecipes = async () => {
    if (!user || !currentSpace) {
      console.error("Cannot seed recipes: No user or space selected");
      toast({
        title: "Error",
        description: "You must be logged in and have a space selected to seed recipes",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Seeding recipes with parameters:", {
        space_id: currentSpace.id,
        user_id: user.id,
        count: 5
      });

      toast({
        title: "Seeding Recipes",
        description: "Adding sample recipes to your space...",
      });

      // Call the Supabase function to create mock recipes
      const { data, error } = await supabase.rpc(
        'create_mock_recipes_in_space',
        { 
          space_id_param: currentSpace.id,
          user_id_param: user.id,
          count_param: 5 
        }
      );

      if (error) {
        console.error("Supabase RPC error:", error);
        throw error;
      }

      console.log("Seed recipe result:", data);

      toast({
        title: "Success",
        description: `${data?.length || 0} recipes have been added to your space.`,
      });
      
      return data;
    } catch (error) {
      console.error("Error seeding recipes:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed recipes",
        variant: "destructive"
      });
    }
  };

  return { seedRecipes };
};
