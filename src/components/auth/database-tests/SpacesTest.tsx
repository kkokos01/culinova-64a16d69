
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Space } from "@/types";

export const useSpacesTest = (userId: string | undefined) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const testUserSpaces = async () => {
    if (!userId) return false;
    
    try {
      // With the new RLS policies, we can directly query spaces
      const { data: userSpaces, error: spacesError } = await supabase
        .from("spaces")
        .select("*")
        .eq("is_active", true);
      
      if (spacesError) {
        setErrorMessage(spacesError.message);
        throw spacesError;
      }
      
      setSpaces(userSpaces as Space[] || []);
      return userSpaces && userSpaces.length > 0 && userSpaces.some(space => space.is_default);
    } catch (error: any) {
      console.error("Error testing user spaces:", error);
      setErrorMessage(error.message);
      return false;
    }
  };

  return {
    spaces,
    errorMessage,
    testUserSpaces
  };
};
