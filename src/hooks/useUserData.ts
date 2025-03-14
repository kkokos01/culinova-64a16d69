
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
          show_nutritional_info: data.show_nutritional_info !== undefined ? data.show_nutritional_info : true
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
      
      // Query the user_spaces table to find memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_spaces")
        .select(`
          id,
          space_id,
          role,
          space:spaces(
            id,
            name,
            max_recipes,
            max_users,
            is_active,
            created_at,
            created_by
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (membershipError) {
        throw membershipError;
      }

      if (membershipData) {
        // Process memberships with proper type assertions
        const processedMemberships: UserSpace[] = membershipData.map(item => {
          // Extract the space object from the item
          const spaceData = item.space as any; // Temporary type for extraction
          
          return {
            id: item.id,
            space_id: item.space_id,
            role: item.role as 'admin' | 'editor' | 'viewer',
            user_id: userId,
            is_active: true,
            created_at: new Date().toISOString(),
            // Process the space object
            space: spaceData ? {
              id: spaceData.id,
              name: spaceData.name,
              created_by: spaceData.created_by,
              max_recipes: spaceData.max_recipes || 0,
              max_users: spaceData.max_users || 0,
              is_active: spaceData.is_active || true,
              created_at: spaceData.created_at
            } as Space : undefined
          };
        });
        
        setMemberships(processedMemberships);
        
        // Extract spaces from memberships
        const spacesList: Space[] = processedMemberships
          .map(membership => membership.space)
          .filter((space): space is Space => space !== undefined);
        
        setSpaces(spacesList);
      }
    } catch (error: any) {
      console.error("Error fetching spaces:", error);
      setIsError(true);
      toast({
        title: "Error fetching spaces",
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
        .insert({
          name,
          created_by: userId,
          max_recipes: 100, // Default values
          max_users: 5,
          is_active: true
        })
        .select()
        .single();
      
      if (spaceError) throw spaceError;
      
      if (spaceData) {
        // Add the creator as an admin of the space
        const { error: membershipError } = await supabase
          .from("user_spaces")
          .insert({
            user_id: userId,
            space_id: spaceData.id,
            role: 'admin',
            is_active: true
          });
        
        if (membershipError) throw membershipError;
        
        // Refresh spaces list
        await fetchSpaces();
        
        toast({
          title: "Space created",
          description: `Your new space "${name}" has been created successfully.`,
        });
        
        return spaceData as Space;
      }
      
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
