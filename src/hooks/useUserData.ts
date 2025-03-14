
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Space, UserSpace } from "@/types";
import { ProfileData } from "@/components/auth/ProfileSettings";

export function useUserData(userId: string | undefined) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpaces = async () => {
    if (!userId) return;
    
    try {
      // First, query the user_spaces table to find memberships
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
        console.error("Error fetching memberships:", membershipError);
        return;
      }

      if (membershipData) {
        // Type assertion to ensure TypeScript understands the structure
        const processedMemberships: UserSpace[] = membershipData.map(item => ({
          id: item.id as string,
          space_id: item.space_id as string,
          role: item.role as 'admin' | 'editor' | 'viewer',
          user_id: userId,
          is_active: true,
          created_at: new Date().toISOString(),
          // Properly type the space object
          space: item.space ? {
            id: (item.space as any).id,
            name: (item.space as any).name,
            created_by: (item.space as any).created_by,
            max_recipes: (item.space as any).max_recipes || 0,
            max_users: (item.space as any).max_users || 0,
            is_active: (item.space as any).is_active || true,
            created_at: (item.space as any).created_at || new Date().toISOString()
          } as Space : undefined
        }));
        
        setMemberships(processedMemberships);
        
        // Extract just the spaces
        const spacesList: Space[] = processedMemberships
          .map(membership => membership.space)
          .filter((space): space is Space => space !== null && space !== undefined);
        
        setSpaces(spacesList);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
      toast({
        title: "Error fetching spaces",
        description: "Could not load your spaces. Please try again.",
        variant: "destructive",
      });
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
    profileData,
    setProfileData,
    spaces,
    memberships,
    fetchSpaces,
  };
}
