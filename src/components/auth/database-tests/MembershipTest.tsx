
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
      console.log("Testing membership for space:", defaultSpace.id);
      
      const { data, error } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", userId)
        .eq("space_id", defaultSpace.id)
        .eq("is_active", true);
      
      if (error) {
        console.error("Error fetching user spaces:", error);
        setErrorMessage(error.message);
        throw error;
      }
      
      console.log("Found memberships:", data);
      setUserSpaces(data as UserSpace[]);
      
      if (!data || data.length === 0) {
        console.log("No memberships found for user", userId, "in space", defaultSpace.id);
        return false;
      }
      
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
      console.log("Fetching raw memberships for user:", userId);
      const { data } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", userId);
      
      console.log("Raw memberships result:", data);    
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
