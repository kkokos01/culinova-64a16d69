
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Space, UserSpace } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SpaceContextType {
  currentSpace: Space | null;
  spaces: Space[];
  memberships: UserSpace[];
  isLoading: boolean;
  setCurrentSpace: (space: Space | null) => void;
  refreshSpaces: () => Promise<void>;
  createSpace: (name: string) => Promise<Space | null>;
  userRole: 'admin' | 'editor' | 'viewer' | null;
  canManageSpace: boolean;
  canEditContent: boolean;
  deleteSpace: (spaceId: string) => Promise<boolean>;
  leaveSpace: (spaceId: string) => Promise<boolean>;
  inviteToSpace: (email: string, role: 'admin' | 'editor' | 'viewer', spaceId: string) => Promise<boolean>;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberships, setMemberships] = useState<UserSpace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const userRole = currentSpace 
    ? memberships.find(m => m.space_id === currentSpace.id)?.role || null
    : null;
    
  const canManageSpace = userRole === 'admin';
  const canEditContent = userRole === 'admin' || userRole === 'editor';

  const fetchSpaces = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // First fetch the memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("is_active", true)
        .eq("user_id", user.id);

      if (membershipError) {
        console.error("Error fetching memberships:", membershipError);
        throw membershipError;
      }
      
      setMemberships(membershipData as UserSpace[] || []);
      
      if (membershipData && membershipData.length > 0) {
        // Get space IDs from memberships
        const spaceIds = membershipData.map((membership) => membership.space_id);
        
        // Fetch spaces with these IDs
        const { data: spacesData, error: spacesError } = await supabase
          .from("spaces")
          .select("*")
          .eq("is_active", true)
          .in("id", spaceIds);
        
        if (spacesError) {
          console.error("Error fetching spaces:", spacesError);
          throw spacesError;
        }
        
        // With our improved RLS, this will only return the user's spaces
        setSpaces(spacesData as Space[] || []);
        
        // Set default space if none is already selected and we have spaces
        if (spacesData && spacesData.length > 0 && !currentSpace) {
          setCurrentSpace(spacesData[0]);
        } else if (currentSpace && !spacesData?.some(space => space.id === currentSpace.id)) {
          // If current space is no longer available, reset it
          setCurrentSpace(spacesData?.[0] || null);
        }
      } else {
        setSpaces([]);
        setCurrentSpace(null);
      }
      
    } catch (error: any) {
      console.error("Error in fetchSpaces:", error);
      toast({
        title: "Error loading spaces",
        description: error.message || "Could not load your spaces.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createSpace = async (name: string): Promise<Space | null> => {
    if (!user?.id) return null;
    
    try {
      setIsLoading(true);
      
      // Insert a new space
      const { data: newSpace, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name,
          created_by: user.id,
          max_recipes: 100,
          max_users: 5,
          is_active: true
        })
        .select()
        .single();
      
      if (spaceError) throw spaceError;
      
      if (newSpace) {
        // Create a membership for this space
        const { error: membershipError } = await supabase
          .from("user_spaces")
          .insert({
            user_id: user.id,
            space_id: newSpace.id,
            role: 'admin',
            is_active: true
          });
          
        if (membershipError) throw membershipError;
        
        // Refresh the spaces after creating a new one
        await fetchSpaces();
        
        toast({
          title: "Space created",
          description: `"${name}" has been created successfully.`,
        });
        
        return newSpace as Space;
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

  const deleteSpace = async (spaceId: string): Promise<boolean> => {
    if (!user?.id || !canManageSpace) return false;

    try {
      setIsLoading(true);
      
      // Only mark the space as inactive rather than deleting it
      const { error } = await supabase
        .from("spaces")
        .update({ is_active: false })
        .eq("id", spaceId)
        .eq("created_by", user.id);
        
      if (error) throw error;
      
      // Refresh spaces
      await fetchSpaces();
      
      toast({
        title: "Space deleted",
        description: "The space has been deleted successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error deleting space:", error);
      toast({
        title: "Error deleting space",
        description: error.message || "Could not delete the space. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveSpace = async (spaceId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      setIsLoading(true);
      
      // Find the user's membership record for this space
      const membership = memberships.find(m => m.space_id === spaceId && m.user_id === user.id);
      
      if (!membership) {
        throw new Error("You're not a member of this space");
      }
      
      // Mark the membership as inactive
      const { error } = await supabase
        .from("user_spaces")
        .update({ is_active: false })
        .eq("id", membership.id)
        .eq("user_id", user.id);
        
      if (error) throw error;
      
      // Refresh spaces
      await fetchSpaces();
      
      toast({
        title: "Left space",
        description: "You have left the space successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error leaving space:", error);
      toast({
        title: "Error leaving space",
        description: error.message || "Could not leave the space. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const inviteToSpace = async (email: string, role: 'admin' | 'editor' | 'viewer', spaceId: string): Promise<boolean> => {
    if (!user?.id || !currentSpace || !canManageSpace) return false;
    
    try {
      setIsLoading(true);
      
      // 1. First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from("auth")
        .select("id")
        .eq("email", email)
        .single();
      
      if (userError) {
        // Handle case where user is not found
        if (userError.code === 'PGRST116') {
          toast({
            title: "User not found",
            description: `No user with email ${email} was found.`,
            variant: "destructive",
          });
          return false;
        }
        throw userError;
      }
      
      if (!userData?.id) {
        toast({
          title: "User not found",
          description: `No user with email ${email} was found.`,
          variant: "destructive",
        });
        return false;
      }
      
      // 2. Check if user is already a member of this space
      const { data: existingMembership, error: membershipCheckError } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", userData.id)
        .eq("space_id", spaceId)
        .eq("is_active", true);
        
      if (membershipCheckError) throw membershipCheckError;
      
      if (existingMembership && existingMembership.length > 0) {
        toast({
          title: "User already invited",
          description: `${email} is already a member of this space.`,
          variant: "destructive",
        });
        return false;
      }
      
      // 3. Create the membership
      const { error: createError } = await supabase
        .from("user_spaces")
        .insert({
          user_id: userData.id,
          space_id: spaceId,
          role,
          is_active: true
        });
        
      if (createError) throw createError;
      
      toast({
        title: "Invitation sent",
        description: `${email} has been added to your space as a ${role}.`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error inviting user to space:", error);
      toast({
        title: "Error inviting user",
        description: error.message || "Could not invite the user. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch spaces when the user changes
  useEffect(() => {
    if (user?.id) {
      fetchSpaces();
    } else {
      // Clear spaces when user logs out
      setSpaces([]);
      setMemberships([]);
      setCurrentSpace(null);
    }
  }, [user?.id]);

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        spaces,
        memberships,
        isLoading,
        setCurrentSpace,
        refreshSpaces: fetchSpaces,
        createSpace,
        userRole,
        canManageSpace,
        canEditContent,
        deleteSpace,
        leaveSpace,
        inviteToSpace
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }
  return context;
}
