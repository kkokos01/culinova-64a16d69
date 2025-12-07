import { supabase } from '@/integrations/supabase/client';

export interface SpaceInvitation {
  id: string;
  space_id: string;
  inviter_id: string;
  recipient_id: string;
  email_address: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  // Joined fields for UI
  space_name?: string;
  inviter_name?: string;
}

export class InvitationService {
  // Get pending invitations for the current user
  static async getPendingInvitations(): Promise<SpaceInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Cast to any to bypass type checking until migration runs and types are updated
    const { data, error } = await (supabase.from('space_invitations' as any) as any)
      .select('*')
      .eq('status', 'pending')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }

    // Fetch space names and inviter emails separately
    const invitationsWithDetails = await Promise.all(
      (data || []).map(async (invitation: any) => {
        try {
          // Get space name
          const { data: spaceData } = await supabase
            .from('spaces')
            .select('name')
            .eq('id', invitation.space_id)
            .single();

          // Get inviter email from user_profiles
          const { data: inviterProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('user_id', invitation.inviter_id)
            .single();

          return {
            ...invitation,
            space_name: spaceData?.name || 'Unknown Collection',
            inviter_name: inviterProfile?.display_name || invitation.email_address
          };
        } catch (err) {
          console.error('Error fetching invitation details:', err);
          return {
            ...invitation,
            space_name: 'Unknown Collection',
            inviter_name: invitation.email_address
          };
        }
      })
    );

    return invitationsWithDetails;
  }

  // Get all invitations for the current user (including past ones)
  static async getAllInvitations(): Promise<SpaceInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Cast to any to bypass type checking until migration runs and types are updated
    const { data, error } = await (supabase.from('space_invitations' as any) as any)
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }

    // Fetch space names and inviter emails separately
    const invitationsWithDetails = await Promise.all(
      (data || []).map(async (invitation: any) => {
        try {
          // Get space name
          const { data: spaceData } = await supabase
            .from('spaces')
            .select('name')
            .eq('id', invitation.space_id)
            .single();

          // Get inviter email from user_profiles
          const { data: inviterProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('user_id', invitation.inviter_id)
            .single();

          return {
            ...invitation,
            space_name: spaceData?.name || 'Unknown Collection',
            inviter_name: inviterProfile?.display_name || invitation.email_address
          };
        } catch (err) {
          console.error('Error fetching invitation details:', err);
          return {
            ...invitation,
            space_name: 'Unknown Collection',
            inviter_name: invitation.email_address
          };
        }
      })
    );

    return invitationsWithDetails;
  }

  // Accept an invitation
  static async acceptInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
    // Cast to any to bypass type checking until migration runs and types are updated
    const { data, error } = await (supabase.rpc as any)('accept_space_invitation', {
      invitation_id_param: invitationId
    });

    if (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, message: error.message };
    }

    // Ensure we return the expected structure
    return (data as { success: boolean; message: string }) || { success: false, message: 'Unknown error occurred' };
  }

  // Reject an invitation
  static async rejectInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
    // Cast to any to bypass type checking until migration runs and types are updated
    const { data, error } = await (supabase.rpc as any)('reject_space_invitation', {
      invitation_id_param: invitationId
    });

    if (error) {
      console.error('Error rejecting invitation:', error);
      return { success: false, message: error.message };
    }

    // Ensure we return the expected structure
    return (data as { success: boolean; message: string }) || { success: false, message: 'Unknown error occurred' };
  }

  // Get count of pending invitations
  static async getPendingInvitationsCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Cast to any to bypass type checking until migration runs and types are updated
    const { count, error } = await (supabase.from('space_invitations' as any) as any)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('recipient_id', user.id);

    if (error) {
      console.error('Error fetching pending invitations count:', error);
      return 0;
    }

    return count || 0;
  }
}
