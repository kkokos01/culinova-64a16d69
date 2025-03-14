
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
          default_unit_system: data.preferred_units === "imperial" ? "imperial" : "metric",
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

  // For now, we'll use mock data for spaces since the tables don't exist in the schema
  const fetchSpaces = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setIsError(false);
      
      // Mock data for now
      const mockSpaces: Space[] = [
        {
          id: "1",
          name: "My Recipes",
          created_by: userId,
          max_recipes: 100,
          max_users: 5,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      
      const mockMemberships: UserSpace[] = [
        {
          id: "1",
          user_id: userId,
          space_id: "1",
          role: "admin",
          is_active: true,
          created_at: new Date().toISOString(),
          space: mockSpaces[0]
        }
      ];
      
      setMemberships(mockMemberships);
      setSpaces(mockSpaces);
      
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
      
      // For now, create a mock space since the tables don't exist
      const newSpace: Space = {
        id: Date.now().toString(),
        name,
        created_by: userId,
        max_recipes: 100,
        max_users: 5,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      // Add to existing spaces
      setSpaces(prev => [...prev, newSpace]);
      
      // Create a membership for this space
      const newMembership: UserSpace = {
        id: Date.now().toString(),
        user_id: userId,
        space_id: newSpace.id,
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString(),
        space: newSpace
      };
      
      setMemberships(prev => [...prev, newMembership]);
      
      toast({
        title: "Space created",
        description: `"${name}" has been created successfully.`,
      });
      
      return newSpace;
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
