
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
      
      // Fetch spaces directly first, using the new RLS policy
      const { data: spacesData, error: spacesError } = await supabase
        .from("spaces")
        .select("*")
        .eq("created_by", user.id)
        .eq("is_active", true);
      
      if (spacesError) {
        console.error("Error fetching spaces:", spacesError);
        throw spacesError;
      }
      
      // Get user's space memberships 
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (membershipError) {
        console.error("Error fetching memberships:", membershipError);
        throw membershipError;
      }
      
      // Get all space IDs from memberships
      const spaceIds = membershipData?.map(m => m.space_id) || [];
      
      // If we have space IDs from memberships, fetch those spaces too
      let spacesFromMemberships: Space[] = [];
      if (spaceIds.length > 0) {
        const { data: memberSpaces, error: memberSpacesError } = await supabase
          .from("spaces")
          .select("*")
          .in("id", spaceIds)
          .eq("is_active", true);
          
        if (memberSpacesError) {
          console.error("Error fetching spaces from memberships:", memberSpacesError);
          throw memberSpacesError;
        }
        
        spacesFromMemberships = memberSpaces as Space[] || [];
      }
      
      // Combine directly owned spaces and spaces from memberships, removing duplicates
      const allSpaces = [...(spacesData || []), ...spacesFromMemberships];
      const uniqueSpacesMap = new Map();
      allSpaces.forEach(space => uniqueSpacesMap.set(space.id, space));
      const uniqueSpaces = Array.from(uniqueSpacesMap.values()) as Space[];
      
      setSpaces(uniqueSpaces);
      setMemberships(membershipData as UserSpace[] || []);
      
      // Set default space if none is already selected and we have spaces
      if (uniqueSpaces.length > 0 && !currentSpace) {
        setCurrentSpace(uniqueSpaces[0]);
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
        const { data: newMembership, error: membershipError } = await supabase
          .from("user_spaces")
          .insert({
            user_id: user.id,
            space_id: newSpace.id,
            role: 'admin',
            is_active: true
          })
          .select()
          .single();
          
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
        canEditContent
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
