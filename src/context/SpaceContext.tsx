
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

  // For now, we'll use simulated data since the database schema doesn't match
  // what our code expects
  const fetchSpaces = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Simulate a single default space for now
      const defaultSpace: Space = {
        id: "default",
        name: "My Recipes",
        created_by: user.id,
        max_recipes: 100,
        max_users: 5,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      const defaultMembership: UserSpace = {
        id: "default-membership",
        user_id: user.id,
        space_id: "default",
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        space: defaultSpace
      };
      
      setSpaces([defaultSpace]);
      setMemberships([defaultMembership]);
      
      // Set the default space as current if none is selected
      if (!currentSpace) {
        setCurrentSpace(defaultSpace);
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
      
      // Show a toast that this functionality isn't available yet
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
