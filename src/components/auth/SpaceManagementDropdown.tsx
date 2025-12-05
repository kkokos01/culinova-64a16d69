import React, { useState } from "react";
import { useSpace } from "@/context/SpaceContext";
import { useToast } from "@/hooks/use-toast";
import { Space, UserSpace } from "@/types";
import { Button } from "@/components/ui/button";
import { SpaceInviteModal } from "./SpaceInviteModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Settings, Users, UserMinus, Trash2, Share2 } from "lucide-react";

interface SpaceManagementDropdownProps {
  space: Space;
  membership?: UserSpace;
  memberships: UserSpace[];
  onSpaceUpdated?: () => void;
}

export function SpaceManagementDropdown({ 
  space, 
  membership, 
  memberships,
  onSpaceUpdated 
}: SpaceManagementDropdownProps) {
  const { 
    deleteSpace, 
    leaveSpace, 
    inviteToSpace, 
    canManageSpace, 
    userRole,
    currentSpace,
    setCurrentSpace 
  } = useSpace();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteSpace = async () => {
    setIsLoading(true);
    try {
      const success = await deleteSpace(space.id);
      if (success) {
        toast({
          title: "Collection deleted",
          description: `"${space.name}" has been deleted.`,
        });
        
        // If this was the current space, clear it
        if (currentSpace?.id === space.id) {
          setCurrentSpace(null);
        }
        
        if (onSpaceUpdated) {
          onSpaceUpdated();
        }
      }
    } catch (error) {
      toast({
        title: "Error deleting collection",
        description: "Failed to delete collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleLeaveSpace = async () => {
    setIsLoading(true);
    try {
      // Check if user is the only admin
      const isAdmin = membership?.role === 'admin';
      const otherAdmins = memberships.filter(m => 
        m.space_id === space.id && 
        m.user_id !== membership?.user_id && 
        m.role === 'admin'
      );

      if (isAdmin && otherAdmins.length === 0) {
        toast({
          title: "Cannot leave collection",
          description: "You are the only admin. Please promote another member to admin before leaving.",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsLeaveDialogOpen(false);
        return;
      }

      const success = await leaveSpace(space.id);
      if (success) {
        toast({
          title: "Left collection",
          description: `You have left "${space.name}".`,
        });
        
        // If this was the current space, clear it
        if (currentSpace?.id === space.id) {
          setCurrentSpace(null);
        }
        
        if (onSpaceUpdated) {
          onSpaceUpdated();
        }
      }
    } catch (error) {
      toast({
        title: "Error leaving collection",
        description: "Failed to leave collection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLeaveDialogOpen(false);
    }
  };

  const handleManageMembers = () => {
    // TODO: Open members management modal
    toast({
      title: "Coming soon",
      description: "Member management will be available soon.",
    });
  };

  const handleShareSpace = () => {
    // This will be handled by the SpaceInviteModal wrapper
  };

  const handleSettings = () => {
    // TODO: Open settings modal
    toast({
      title: "Coming soon",
      description: "Collection settings will be available soon.",
    });
  };

  const isAdmin = membership?.role === 'admin';
  const isMember = !isAdmin && membership?.role !== undefined;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Admin Actions */}
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleManageMembers}>
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </DropdownMenuItem>
              <SpaceInviteModal space={space}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share & Invite
                </DropdownMenuItem>
              </SpaceInviteModal>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Collection
              </DropdownMenuItem>
            </>
          )}
          
          {/* Member Actions */}
          {isMember && (
            <DropdownMenuItem 
              onClick={() => setIsLeaveDialogOpen(true)}
              className="text-orange-600 focus:text-orange-600"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Leave Collection
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{space.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the collection 
              and all its recipes for all members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSpace} 
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave "{space.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to this collection and its recipes. You can be invited back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLeaveSpace} 
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? "Leaving..." : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
