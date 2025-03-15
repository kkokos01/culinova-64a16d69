
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserSpace, Space } from "@/types";

export const useMembershipTest = (userId: string | undefined, spaces: Space[]) => {
  const [userSpaces, setUserSpaces] = useState<UserSpace[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const testSpaceMembership = async () => {
    if (!userId || spaces.length === 0) return false;
    
    try {
      // Find the default space
      const defaultSpace = spaces.find(space => space.is_default) || spaces[0];
      
      const { data, error } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", userId)
        .eq("space_id", defaultSpace.id)
        .eq("is_active", true);
      
      if (error) {
        setErrorMessage(error.message);
        throw error;
      }
      
      setUserSpaces(data as UserSpace[]);
      
      if (data.length === 0) return false;
      
      // Check if user is admin of their default space
      const isAdmin = data.some(membership => membership.role === 'admin');
      
      if (!isAdmin) {
        console.log("User has membership but not admin role:", data);
      }
      
      return isAdmin;
    } catch (error: any) {
      console.error("Error testing space membership:", error);
      setErrorMessage(error.message);
      return false;
    }
  };
  
  const fetchRawMemberships = async () => {
    if (!userId) return null;
    
    try {
      const { data } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", userId);
        
      return data;
    } catch (error) {
      console.error("Error fetching raw memberships:", error);
      return null;
    }
  };

  return {
    userSpaces,
    errorMessage,
    testSpaceMembership,
    fetchRawMemberships
  };
};
