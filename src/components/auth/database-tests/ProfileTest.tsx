
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types";

export const useProfileTest = (userId: string | undefined) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const testUserProfile = async () => {
    if (!userId) return false;
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) {
        setErrorMessage(error.message);
        throw error;
      }
      
      if (data) {
        setUserProfile(data as UserProfile);
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      console.error("Error testing user profile:", error);
      setErrorMessage(error.message);
      return false;
    }
  };

  return {
    userProfile,
    errorMessage,
    testUserProfile
  };
};
