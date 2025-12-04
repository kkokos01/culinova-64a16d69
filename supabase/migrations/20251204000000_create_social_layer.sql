-- Social Layer Migration: Activities, Forking, and Discovery
-- Creates the infrastructure for social features in Culinova
-- Version: 1.0
-- Date: 2025-12-04

-- 1. Create Activities Table with proper constraints
create table public.activities (
  id uuid not null default gen_random_uuid (),
  space_id uuid references public.spaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('recipe_created', 'recipe_modified', 'recipe_forked', 'user_joined')),
  entity_id uuid not null,
  entity_type text default 'recipe' check (entity_type in ('recipe', 'member')),
  details jsonb default '{}',
  created_at timestamp with time zone not null default now(),
  constraint activities_pkey primary key (id)
);

-- 2. Critical performance indexes for activity feeds
create index idx_activities_space_created on public.activities(space_id, created_at desc);
create index idx_activities_actor on public.activities(actor_id, created_at desc);

-- 3. Enable Row Level Security (RLS) on activities table
alter table public.activities enable row level security;

-- 4. RLS Policies for activities table
-- Users can view activities in their spaces
create policy "Users can view space activities" on public.activities
for select using (space_id in (
  select space_id from public.user_spaces 
  where user_id = auth.uid() and is_active = true
));

-- Users can insert activities for their own actions
create policy "Users can insert own activities" on public.activities
for insert with check (actor_id = auth.uid());

-- 5. Safe forked_count addition for recipe tracking
do $$
begin
    if not exists (select 1 from information_schema.columns 
                   where table_name = 'recipes' and column_name = 'forked_count') then
        alter table public.recipes 
        add column forked_count integer default 0;
    end if;
end $$;

-- 6. Create trigger to increment forked_count when recipe is forked
create or replace function increment_fork_count()
returns trigger as $$
begin
    update public.recipes 
    set forked_count = forked_count + 1 
    where id = new.parent_recipe_id;
    return new;
end;
$$ language plpgsql security definer;

create trigger trigger_increment_fork_count
    after insert on public.recipes
    for each row
    when (new.parent_recipe_id is not null)
    execute procedure increment_fork_count();

-- 7. Add helpful comments for documentation
comment on table public.activities is 'Activity feed tracking for social features';
comment on column public.activities.action_type is 'Type of action: recipe_created, recipe_modified, recipe_forked, user_joined';
comment on column public.activities.entity_id is 'ID of the related entity (recipe, user, etc.)';
comment on column public.activities.details is 'JSON snapshot of activity data (title, actor_name, etc.)';
comment on column public.recipes.parent_recipe_id is 'Original recipe ID for forked recipes (attribution)';
