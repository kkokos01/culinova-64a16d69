
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpace } from "@/context/SpaceContext";

type CreateDefaultSpaceProps = {
  userId: string;
  onSuccess: () => void;
};

export const CreateDefaultSpace = ({ userId, onSuccess }: CreateDefaultSpaceProps) => {
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { refreshSpaces } = useSpace();

  const createDefaultSpace = async () => {
    if (!userId) return;
    
    setCreatingSpace(true);
    setErrorMessage(null);
    
    try {
      console.log("Creating default space for user:", userId);
      
      // Call the Supabase function to create a default space
      const { data, error } = await supabase.rpc(
        'create_space_for_existing_user',
        { user_id_param: userId }
      );
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("Failed to create default space - no space ID returned");
      }
      
      console.log("Default space created successfully, space_id:", data);
      
      toast({
        title: "Space created",
        description: "Default space has been created successfully!",
      });
      
      // Refresh spaces in the SpaceContext
      await refreshSpaces();
      
      // Wait a moment for the database to update
      setTimeout(async () => {
        // Re-run the tests to update the UI
        onSuccess();
      }, 1000);
      
    } catch (error: any) {
      console.error("Error creating default space:", error);
      setErrorMessage(error.message);
      
      toast({
        title: "Error creating space",
        description: error.message || "Could not create default space",
        variant: "destructive",
      });
    } finally {
      setCreatingSpace(false);
    }
  };

  return (
    <div className="my-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h4 className="text-sm font-medium text-blue-800 mb-2">Create Default Space</h4>
      <p className="text-sm text-slate-600 mb-3">
        Your account was created before space functionality was added. 
        Click the button below to create a default space.
      </p>
      <Button 
        onClick={createDefaultSpace} 
        disabled={creatingSpace}
        className="w-full"
      >
        {creatingSpace ? "Creating Space..." : "Create Default Space"}
      </Button>
      {errorMessage && (
        <p className="text-xs text-red-500 mt-2">
          Error: {errorMessage}
        </p>
      )}
    </div>
  );
};

export default CreateDefaultSpace;
