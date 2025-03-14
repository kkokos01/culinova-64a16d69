
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Space, UserSpace } from "@/types";
import { ProfileData } from "@/components/auth/ProfileSettings";

export function useUserData(userId: string | undefined) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberships, setMemberships] = useState<UserSpace[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: "",
    avatar_url: "",
    default_unit_system: "metric",
    theme_preference: "light",
    default_servings: 2,
    show_nutritional_info: true
  });

  const fetchProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setIsError(false);
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (data) {
        // Cast preferred_units to the expected type or use default if not valid
        const unitSystem = data.preferred_units === "imperial" ? "imperial" : "metric";
        
        setProfileData({
          display_name: data.display_name || "",
          avatar_url: data.avatar_url || "",
          default_unit_system: unitSystem, // Ensure it's either "metric" or "imperial"
          theme_preference: "light", // Default value since it doesn't exist in DB
          default_servings: 2, // Default value since it doesn't exist in DB
          show_nutritional_info: true // Default value since it doesn't exist in DB
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setIsError(true);
      toast({
        title: "Error loading profile",
        description: "Could not load your profile information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // For now, spaces and memberships will be empty since we need to update the database schema
  // We'll simulate the spaces functionality until the database is updated

  const fetchSpaces = async () => {
    // For now, just set loading to false as we can't fetch real spaces yet
    setIsLoading(false);
  };

  const createSpace = async (name: string) => {
    if (!userId) return null;
    
    try {
      setIsLoading(true);
      
      // For now, just show a message that space creation isn't available
      toast({
        title: "Space creation unavailable",
        description: "Space creation is currently unavailable - database schema needs updating.",
        variant: "destructive",
      });
      
      return null;
    } catch (error: any) {
      console.error("Error creating space:", error);
      toast({
        title: "Error creating space",
        description: error.message || "Could not create the space. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchSpaces();
    }
  }, [userId]);

  return {
    isLoading,
    isError,
    profileData,
    setProfileData,
    spaces,
    memberships,
    fetchSpaces,
    fetchProfile,
    createSpace,
  };
}
