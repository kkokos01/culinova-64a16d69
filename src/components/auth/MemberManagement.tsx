import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Crown, 
  Edit, 
  Eye, 
  Trash2, 
  UserX,
  AlertTriangle,
  RefreshCw,
  Shield
} from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  space_id: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  display_name?: string;
  email_address?: string;
  avatar_url?: string;
  is_phantom?: boolean; // User doesn't exist in auth.users
}

interface MemberManagementProps {
  spaceId: string;
  onMembersChange?: () => void;
}

export function MemberManagement({ spaceId, onMembersChange }: MemberManagementProps) {
  const { user } = useAuth();
  const { userRole, canManageSpace } = useSpace();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Get all memberships for this space
      const { data: memberships, error: membershipError } = await supabase
        .from('user_spaces')
        .select('*')
        .eq('space_id', spaceId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (membershipError) throw membershipError;

      // Get user profiles for all members (simplified approach)
      const userIds = memberships?.map(m => m.user_id) || [];
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Check which users actually exist in auth.users (for phantom detection)
      const { data: authUsers, error: authError } = await (supabase.rpc as any)('get_auth_users', {
        user_ids: userIds
      });

      // Combine the data using app's existing display logic
      const membersWithDetails: Member[] = memberships?.map(membership => {
        const profile = profiles?.find(p => p.user_id === membership.user_id);
        const existsInAuth = Array.isArray(authUsers) && authUsers.includes(membership.user_id);
        
        // Use the same logic as RecipeCreatePage for display names
        const displayName = profile?.display_name || 
          membership.user_id?.split('@')[0] || // Fallback for user ID as email
          'User';
        
        return {
          ...membership,
          display_name: displayName,
          avatar_url: profile?.avatar_url,
          is_phantom: !existsInAuth,
          role: membership.role as 'admin' | 'editor' | 'viewer'
        };
      }) || [];

      setMembers(membersWithDetails);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error loading members",
        description: "Could not load the member list.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (!canManageSpace) {
      toast({
        title: "Permission denied",
        description: "Only admins can remove members.",
        variant: "destructive",
      });
      return;
    }

    // Don't allow removing yourself if you're the only admin
    const adminCount = members.filter(m => m.role === 'admin' && m.is_active).length;
    if (memberUserId === user?.id && adminCount <= 1) {
      toast({
        title: "Cannot remove",
        description: "You cannot remove yourself as the last admin.",
        variant: "destructive",
      });
      return;
    }

    setIsRemoving(memberId);
    try {
      const { error } = await supabase
        .from('user_spaces')
        .update({ is_active: false })
        .eq('id', memberId)
        .eq('space_id', spaceId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: "The member has been removed from the collection.",
      });

      // Refresh the members list
      await fetchMembers();
      onMembersChange?.();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error removing member",
        description: "Could not remove the member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  useEffect(() => {
    if (spaceId) {
      fetchMembers();
    }
  }, [spaceId]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
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

  const getInitials = (name?: string, email?: string) => {
    if (!name || name === 'Unknown User') {
      // Use email first letter as fallback, like Navbar does
      if (email) {
        return email.charAt(0).toUpperCase();
      }
      return '??';
    }
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!canManageSpace) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Shield className="h-5 w-5" />
            <span>Only admins can manage members.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Collection Members</CardTitle>
              <CardDescription>
                Manage who has access to this collection
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMembers}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin">
              <RefreshCw className="h-6 w-6 text-gray-400" />
            </div>
            <span className="ml-2 text-gray-500">Loading members...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No members found in this collection.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  member.is_phantom ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback className={member.is_phantom ? 'bg-orange-200' : ''}>
                      {member.display_name === 'User' ? 'U' : getInitials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.display_name}
                      </span>
                      {member.is_phantom && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Phantom User
                        </Badge>
                      )}
                      {member.user_id === user?.id && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <Badge className={getRoleColor(member.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.is_phantom && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMember(member.id, member.user_id)}
                      disabled={isRemoving === member.id}
                      className="flex items-center gap-2"
                    >
                      {isRemoving === member.id ? (
                        "Removing..."
                      ) : (
                        <>
                          <UserX className="h-4 w-4" />
                          Remove Phantom
                        </>
                      )}
                    </Button>
                  )}
                  
                  {member.user_id !== user?.id && !member.is_phantom && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember(member.id, member.user_id)}
                      disabled={isRemoving === member.id}
                      className="flex items-center gap-2"
                    >
                      {isRemoving === member.id ? (
                        "Removing..."
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p><strong>Total members:</strong> {members.length}</p>
            {members.some(m => m.is_phantom) && (
              <p className="text-orange-600">
                <strong>⚠️ Phantom users detected:</strong> {members.filter(m => m.is_phantom).length} 
                - These are users that don't exist in the system and can be safely removed.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
