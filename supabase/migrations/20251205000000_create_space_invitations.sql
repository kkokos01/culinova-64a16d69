-- Space Invitations Migration
-- Creates invitation system with pending approvals
-- Version: 1.0
-- Date: 2025-12-05

-- 1. Create space_invitations table
create table public.space_invitations (
  id uuid not null default gen_random_uuid (),
  space_id uuid not null references public.spaces(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  email_address text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  message text default null,
  expires_at timestamp with time zone not null default (now() + interval '7 days'),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  responded_at timestamp with time zone default null,
  constraint space_invitations_pkey primary key (id)
);

-- 2. Create indexes for performance
create index idx_space_invitations_recipient_status on public.space_invitations(recipient_id, status);
create index idx_space_invitations_space_id on public.space_invitations(space_id);
create index idx_space_invitations_expires_at on public.space_invitations(expires_at);

-- 3. Enable Row Level Security (RLS)
alter table public.space_invitations enable row level security;

-- 4. RLS Policies
-- Users can view invitations sent to them
create policy "Users can view own invitations" on public.space_invitations
for select using (recipient_id = auth.uid());

-- Users can view invitations they sent in their spaces
create policy "Users can view sent invitations" on public.space_invitations
for select using (
  inviter_id = auth.uid() and 
  space_id in (
    select space_id from public.user_spaces 
    where user_id = auth.uid() and is_active = true and role = 'admin'
  )
);

-- Users can insert invitations (they must be admin of the space)
create policy "Admins can create invitations" on public.space_invitations
for insert with check (
  inviter_id = auth.uid() and
  space_id in (
    select space_id from public.user_spaces 
    where user_id = auth.uid() and is_active = true and role = 'admin'
  )
);

-- Users can update their own invitations status
create policy "Users can update own invitations" on public.space_invitations
for update using (recipient_id = auth.uid());

-- 5. Create function to accept invitation
create or replace function accept_space_invitation(
  invitation_id_param uuid
)
returns json
language plpgsql
security definer
as $$
declare
  invitation_record record;
  existing_membership record;
begin
  -- Get the invitation
  select * into invitation_record 
  from public.space_invitations 
  where id = invitation_id_param and recipient_id = auth.uid();
  
  -- If invitation doesn't exist or doesn't belong to user
  if invitation_record is null then
    return json_build_object('success', false, 'error', 'Invitation not found.');
  end if;
  
  -- Check if invitation is still pending
  if invitation_record.status != 'pending' then
    return json_build_object('success', false, 'error', 'Invitation is no longer valid.');
  end if;
  
  -- Check if invitation hasn't expired
  if invitation_record.expires_at < now() then
    -- Update status to expired
    update public.space_invitations 
    set status = 'expired', updated_at = now() 
    where id = invitation_id_param;
    return json_build_object('success', false, 'error', 'Invitation has expired.');
  end if;
  
  -- Check if user is already a member
  select * into existing_membership 
  from public.user_spaces 
  where user_id = invitation_record.recipient_id 
    and space_id = invitation_record.space_id 
    and is_active = true;
  
  if existing_membership is not null then
    return json_build_object('success', false, 'error', 'You are already a member of this collection.');
  end if;
  
  -- Add user to space
  insert into public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active,
    created_at
  ) values (
    invitation_record.recipient_id,
    invitation_record.space_id,
    invitation_record.role,
    true,
    now()
  );
  
  -- Update invitation status
  update public.space_invitations 
  set status = 'accepted', 
      responded_at = now(),
      updated_at = now() 
  where id = invitation_id_param;
  
  -- Create activity record for the acceptance
  insert into public.activities (
    space_id,
    actor_id,
    action_type,
    entity_id,
    entity_type,
    details,
    created_at
  ) values (
    invitation_record.space_id,
    invitation_record.recipient_id,
    'user_joined',
    invitation_record.recipient_id,
    'member',
    json_build_object(
      'invited_email', invitation_record.email_address,
      'role', invitation_record.role,
      'invited_by', invitation_record.inviter_id,
      'accepted_at', now()
    ),
    invitation_record.created_at -- Use original invitation timestamp
  );
  
  return json_build_object('success', true, 'message', 'Successfully joined the collection!');
  
exception
  when others then
    return json_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 6. Create function to reject invitation
create or replace function reject_space_invitation(
  invitation_id_param uuid
)
returns json
language plpgsql
security definer
as $$
declare
  invitation_record record;
begin
  -- Get the invitation
  select * into invitation_record 
  from public.space_invitations 
  where id = invitation_id_param and recipient_id = auth.uid();
  
  -- If invitation doesn't exist or doesn't belong to user
  if invitation_record is null then
    return json_build_object('success', false, 'error', 'Invitation not found.');
  end if;
  
  -- Check if invitation is still pending
  if invitation_record.status != 'pending' then
    return json_build_object('success', false, 'error', 'Invitation is no longer valid.');
  end if;
  
  -- Update invitation status
  update public.space_invitations 
  set status = 'rejected', 
      responded_at = now(),
      updated_at = now() 
  where id = invitation_id_param;
  
  return json_build_object('success', true, 'message', 'Invitation rejected.');
  
exception
  when others then
    return json_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 7. Grant execute permissions to authenticated users
grant execute on function accept_space_invitation(uuid) to authenticated;
grant execute on function reject_space_invitation(uuid) to authenticated;

-- 8. Add helpful comments
comment on table public.space_invitations is 'Pending invitations for users to join spaces, requiring approval';
comment on column public.space_invitations.status is 'Invitation status: pending, accepted, rejected, expired';
comment on column public.space_invitations.expires_at is 'When the invitation automatically expires';
comment on column public.space_invitations.responded_at is 'When the user responded to the invitation';

-- 9. Create function to automatically expire old invitations (optional cleanup)
create or replace function cleanup_expired_invitations()
returns integer
language plpgsql
security definer
as $$
declare
  expired_count integer;
begin
  update public.space_invitations 
  set status = 'expired', updated_at = now() 
  where status = 'pending' and expires_at < now();
  
  get diagnostics expired_count = row_count;
  
  return expired_count;
end;
$$;

grant execute on function cleanup_expired_invitations() to authenticated;
