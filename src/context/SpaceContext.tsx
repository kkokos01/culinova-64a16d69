
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
      
      // Query user_spaces to get memberships with their related spaces
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_spaces")
        .select(`
          id,
          space_id,
          role,
          user_id,
          is_active,
          created_at,
          space:spaces(
            id,
            name,
            created_by,
            max_recipes,
            max_users,
            is_active,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (membershipError) throw membershipError;

      if (membershipData) {
        // Process memberships
        const processedMemberships: UserSpace[] = membershipData.map(item => {
          // Extract the space object from the item
          const spaceData = item.space as any; // Temporary type for extraction
          
          return {
            id: item.id,
            space_id: item.space_id,
            user_id: item.user_id,
            role: item.role as 'admin' | 'editor' | 'viewer',
            is_active: item.is_active,
            created_at: item.created_at,
            space: spaceData ? {
              id: spaceData.id,
              name: spaceData.name,
              created_by: spaceData.created_by,
              max_recipes: spaceData.max_recipes || 0,
              max_users: spaceData.max_users || 0,
              is_active: spaceData.is_active,
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
        
        // If there's no current space set but we have spaces, set the first one
        if (!currentSpace && spacesList.length > 0) {
          setCurrentSpace(spacesList[0]);
        }
        
        // If the current space is no longer in the list, reset it
        if (currentSpace && !spacesList.some(space => space.id === currentSpace.id)) {
          setCurrentSpace(spacesList.length > 0 ? spacesList[0] : null);
        }
      }
    } catch (error: any) {
      console.error("Error fetching spaces:", error);
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
      
      // Create a new space
      const { data: spaceData, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name,
          created_by: user.id,
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
            user_id: user.id,
            space_id: spaceData.id,
            role: 'admin',
            is_active: true
          });
        
        if (membershipError) throw membershipError;
        
        // Refresh spaces list
        await fetchSpaces();
        
        // Set the newly created space as the current space
        setCurrentSpace(spaceData as Space);
        
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

  // Fetch spaces when the user changes
  useEffect(() => {
    fetchSpaces();
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
