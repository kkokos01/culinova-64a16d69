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
        setProfileData({
          display_name: data.display_name || "",
          avatar_url: data.avatar_url || "",
          default_unit_system: data.default_unit_system || "metric",
          theme_preference: data.theme_preference || "light",
          default_servings: data.default_servings || 2,
          show_nutritional_info: data.show_nutritional_info !== false
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

  const fetchSpaces = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setIsError(false);
      
      // Step 1: Get all space memberships for the user
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);
        
      if (membershipError) throw membershipError;
      
      if (membershipData && membershipData.length > 0) {
        setMemberships(membershipData);
        
        // Step 2: Get all spaces based on memberships
        const spaceIds = membershipData.map(membership => membership.space_id);
        
        const { data: spacesData, error: spacesError } = await supabase
          .from("spaces")
          .select("*")
          .in("id", spaceIds)
          .eq("is_active", true);
          
        if (spacesError) throw spacesError;
        
        if (spacesData) {
          setSpaces(spacesData);
        }
      } else {
        // If no memberships found, clear spaces
        setSpaces([]);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
      setIsError(true);
      toast({
        title: "Error loading spaces",
        description: "Could not load your spaces. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSpace = async (name: string) => {
    if (!userId) return null;
    
    try {
      setIsLoading(true);
      
      // Create a new space
      const { data: spaceData, error: spaceError } = await supabase
        .from("spaces")
        .insert([
          { 
            name, 
            created_by: userId, 
            max_recipes: 100, 
            max_users: 5, 
            is_active: true 
          }
        ])
        .select()
        .single();
        
      if (spaceError) throw spaceError;
      
      if (!spaceData) throw new Error("Failed to create space");
      
      // Create membership as admin for the creator
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_spaces")
        .insert([
          {
            user_id: userId,
            space_id: spaceData.id,
            role: "admin",
            is_active: true
          }
        ])
        .select()
        .single();
        
      if (membershipError) throw membershipError;
      
      // Refresh spaces list
      await fetchSpaces();
      
      toast({
        title: "Space created",
        description: `"${name}" has been created successfully.`,
      });
      
      return spaceData;
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
