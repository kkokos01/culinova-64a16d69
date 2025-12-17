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
  createSpace: (name: string, options?: { description?: string, isPublic?: boolean }) => Promise<Space | null>;
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
        // Get space IDs from memberships (limit to first 50 to avoid URL length issues)
        const spaceIds = membershipData.map((membership) => membership.space_id).slice(0, 50);
        
        // Fetch spaces with these IDs in batches to avoid URL length limits
        const { data: spacesData, error: spacesError } = await supabase
          .from("spaces")
          .select("*")
          .eq("is_active", true)
          .in("id", spaceIds);
        
        if (spacesError) {
          console.error("Error fetching spaces:", spacesError);
          throw spacesError;
        }
        
        if (spacesData && spacesData.length > 0) {
          setSpaces(spacesData as Space[] || []);
          
          // First try to find the default space
          const defaultSpace = spacesData.find(space => space.is_default);
          
          // Set space priority: Current selected space (if still valid) > Default space > First space
          if (currentSpace && spacesData.some(space => space.id === currentSpace.id)) {
            // Keep current selection
          } else if (defaultSpace) {
            setCurrentSpace(defaultSpace);
          } else {
            setCurrentSpace(spacesData[0]);
          }
        } else {
          setSpaces([]);
          setCurrentSpace(null);
        }
      } else {
        setSpaces([]);
        setCurrentSpace(null);
        
        // If user has no spaces, call the function to create a default space
        if (user?.id) {
          console.log("User has no spaces, creating default space");
          const spaceId = await createDefaultSpaceForUser(user.id);
          if (spaceId) {
            // Re-fetch spaces after creating the default space
            await fetchSpaces();
          }
        }
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

  const createDefaultSpaceForUser = async (userId: string): Promise<string | null> => {
    try {
      // Call the Supabase function to create a default space
      const { data, error } = await supabase.rpc('create_space_for_existing_user', {
        user_id_param: userId
      });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error("Error creating default space:", error);
      return null;
    }
  };

  const createSpace = async (name: string, options?: { description?: string, isPublic?: boolean }): Promise<Space | null> => {
    if (!user?.id) return null;
    
    try {
      setIsLoading(true);
      
      // Insert a new space (not setting as default since users should only have one default space)
      const { data: newSpace, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name,
          created_by: user.id,
          max_recipes: 100,
          max_users: 5,
          is_active: true,
          is_default: false, // Not setting as default for additional spaces
          ...(options?.description && { description: options.description }),
          ...(options?.isPublic !== undefined && { is_public: options.isPublic })
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
    if (!user?.id || !canManageSpace) return false;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('invite_user_to_space' as any, {
        email_to_invite: email,
        space_id_param: spaceId,
        user_role: role,
        invitation_message: null // No message field in UI yet, pass null
      });
      
      if (error) throw error;
      
      const result = data as { 
        success: boolean; 
        error?: string; 
        message?: string; 
        invitation_id?: string;
        user_exists?: boolean;
      };
      
      if (result.success) {
        const space = spaces.find(s => s.id === spaceId);
        
        if (result.user_exists === false) {
          // NEW USER FLOW - Send email invitation
          try {
            // Get inviter details for the email
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('display_name')
              .eq('user_id', user.id)
              .single();
            
            // Call the Edge Function to send auth invitation email
            const { error: emailError } = await supabase.functions.invoke('send-auth-invitation', {
              body: {
                email: email,
                spaceName: space?.name || 'A Collection',
                inviterName: profile?.display_name || 'Someone'
              }
            });
            
            if (emailError) {
              console.error('Email sending failed:', emailError);
              toast({
                title: "Invitation created",
                description: "User will be invited after they sign up. Email delivery may be delayed.",
                variant: "default",
              });
            } else {
              toast({
                title: "Invitation email sent",
                description: result.message || "User will receive an email invitation.",
              });
            }
          } catch (emailError) {
            console.error('Email error:', emailError);
            toast({
              title: "Invitation created",
              description: "User will be invited after they sign up. Please check email delivery.",
              variant: "default",
            });
          }
        } else {
          // EXISTING USER FLOW - In-app notification only
          toast({
            title: "Invitation sent",
            description: result.message || "User will be notified in-app.",
          });
        }
        
        // Refresh spaces to update member count and memberships
        await fetchSpaces();
        return true;
      } else {
        toast({
          title: "Invitation failed",
          description: result.error || "Failed to send invitation.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Error inviting user to space:", error);
      toast({
        title: "Error sending invitation",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
