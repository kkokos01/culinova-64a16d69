
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRLSTest = (userId: string | undefined) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const testRLSPolicies = async () => {
    if (!userId) return false;
    
    try {
      // Try to query any user profiles that don't belong to the current user
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .neq("user_id", userId)
        .limit(1);
      
      if (error) {
        // If we get a permission error, RLS is working correctly
        return error.message.includes("permission") || error.message.includes("policy");
      }
      
      // If we can see other users' data, RLS is not working correctly
      return data.length === 0;
    } catch (error: any) {
      console.error("Error testing RLS policies:", error);
      setErrorMessage(error.message);
      return error.message.includes("permission") || error.message.includes("policy");
    }
  };

  return {
    errorMessage,
    testRLSPolicies
  };
};
