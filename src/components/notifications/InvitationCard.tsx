import React, { useState } from "react";
import { SpaceInvitation, InvitationService } from "@/services/supabase/invitationService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  Users, 
  Mail, 
  Clock,
  Shield,
  Edit,
  Eye
} from "lucide-react";

interface InvitationCardProps {
  invitation: SpaceInvitation;
  onActionComplete?: () => void;
}

export function InvitationCard({ invitation, onActionComplete }: InvitationCardProps) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await InvitationService.acceptInvitation(invitation.id);
      if (result.success) {
        toast({
          title: "Invitation accepted!",
          description: `You have successfully joined "${invitation.space_name}".`,
        });
        onActionComplete?.();
      } else {
        toast({
          title: "Error accepting invitation",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const result = await InvitationService.rejectInvitation(invitation.id);
      if (result.success) {
        toast({
          title: "Invitation declined",
          description: `You have declined the invitation to "${invitation.space_name}".`,
        });
        onActionComplete?.();
      } else {
        toast({
          title: "Error declining invitation",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <Card className={`w-full ${isExpired ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Collection Invitation</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                From {invitation.inviter_name}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getRoleColor(invitation.role)}>
              <div className="flex items-center gap-1">
                {getRoleIcon(invitation.role)}
                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </div>
            </Badge>
            {isExpired && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Expired
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-1">
            "{invitation.space_name}"
          </h4>
          {invitation.message && (
            <p className="text-sm text-gray-600 italic">
              "{invitation.message}"
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {isExpired ? 'Expired' : `Expires in ${formatTimeAgo(invitation.expires_at)}`}
            </span>
            <span className="mx-1">•</span>
            <span>Sent {formatTimeAgo(invitation.created_at)}</span>
          </div>
        </div>
        
        {!isExpired && invitation.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="flex-1"
            >
              {isAccepting ? (
                "Accepting..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isAccepting || isRejecting}
              className="flex-1"
            >
              {isRejecting ? (
                "Declining..."
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
          </div>
        )}
        
        {invitation.status === 'accepted' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            You joined this collection
          </div>
        )}
        
        {invitation.status === 'rejected' && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <X className="h-4 w-4" />
            You declined this invitation
          </div>
        )}
      </CardContent>
    </Card>
  );
}
