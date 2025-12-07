import React, { useState, useEffect } from "react";
import { InvitationService, SpaceInvitation } from "@/services/supabase/invitationService";
import { InvitationCard } from "./InvitationCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Inbox
} from "lucide-react";

interface NotificationsListProps {
  onInvitationAction?: () => void;
}

export function NotificationsList({ onInvitationAction }: NotificationsListProps) {
  const [pendingInvitations, setPendingInvitations] = useState<SpaceInvitation[]>([]);
  const [allInvitations, setAllInvitations] = useState<SpaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const [pending, all] = await Promise.all([
        InvitationService.getPendingInvitations(),
        InvitationService.getAllInvitations()
      ]);
      setPendingInvitations(pending);
      setAllInvitations(all);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleInvitationAction = () => {
    fetchInvitations();
    onInvitationAction?.();
  };

  const getInvitationsByStatus = (status: SpaceInvitation['status']) => {
    return allInvitations.filter(inv => inv.status === status);
  };

  const getStatusIcon = (status: SpaceInvitation['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <Mail className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: SpaceInvitation['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin">
          <RefreshCw className="h-6 w-6 text-gray-400" />
        </div>
        <span className="ml-2 text-gray-500">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-semibold">Notifications</h2>
          {pendingInvitations.length > 0 && (
            <Badge className="bg-blue-600 text-white">
              {pendingInvitations.length} pending
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInvitations}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Accepted
            {getInvitationsByStatus('accepted').length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getInvitationsByStatus('accepted').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Declined
            {getInvitationsByStatus('rejected').length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getInvitationsByStatus('rejected').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Expired
            {getInvitationsByStatus('expired').length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getInvitationsByStatus('expired').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="pending" className="mt-6">
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
              <p className="text-gray-500">You don't have any collection invitations waiting for your response.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onActionComplete={handleInvitationAction}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {getInvitationsByStatus('accepted').length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accepted invitations</h3>
              <p className="text-gray-500">You haven't accepted any collection invitations yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getInvitationsByStatus('accepted').map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onActionComplete={handleInvitationAction}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {getInvitationsByStatus('rejected').length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No declined invitations</h3>
              <p className="text-gray-500">You haven't declined any collection invitations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getInvitationsByStatus('rejected').map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onActionComplete={handleInvitationAction}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          {getInvitationsByStatus('expired').length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expired invitations</h3>
              <p className="text-gray-500">You don't have any expired collection invitations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getInvitationsByStatus('expired').map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onActionComplete={handleInvitationAction}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
