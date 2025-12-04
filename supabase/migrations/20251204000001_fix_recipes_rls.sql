-- Security Fix: Add proper RLS policies for recipes table
-- This ensures public recipes are readable and fork operations are secure
-- Uses safe policy creation to avoid conflicts with existing policies

-- First, ensure RLS is enabled on recipes
alter table public.recipes enable row level security;

-- Policy: Anyone can read public recipes (safe creation)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'recipes' and policyname = 'Public recipes are readable by everyone'
    ) then
        create policy "Public recipes are readable by everyone"
        on public.recipes for select
        using (privacy_level = 'public');
    end if;
end $$;

-- Policy: Users can read recipes in their spaces (safe creation)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'recipes' and policyname = 'Users can read recipes in their spaces'
    ) then
        create policy "Users can read recipes in their spaces"
        on public.recipes for select
        using (
          space_id in (
            select space_id from public.user_spaces 
            where user_id = auth.uid() and is_active = true
          )
        );
    end if;
end $$;

-- Policy: Users can read their own private recipes (safe creation)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'recipes' and policyname = 'Users can read their own recipes'
    ) then
        create policy "Users can read their own recipes"
        on public.recipes for select
        using (user_id = auth.uid());
    end if;
end $$;

-- Policy: Users can insert recipes in their spaces (safe creation)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'recipes' and policyname = 'Users can create recipes in their spaces'
    ) then
        create policy "Users can create recipes in their spaces"
        on public.recipes for insert
        with check (
          user_id = auth.uid() and (
            space_id in (
              select space_id from public.user_spaces 
              where user_id = auth.uid() and is_active = true
            ) or space_id is null
          )
        );
    end if;
end $$;

-- Policy: Users can update recipes they own in their spaces (safe creation)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'recipes' and policyname = 'Users can update their own recipes'
    ) then
        create policy "Users can update their own recipes"
        on public.recipes for update
        using (
          user_id = auth.uid() and (
            space_id in (
              select space_id from public.user_spaces 
              where user_id = auth.uid() and is_active = true
            ) or space_id is null
          )
        );
    end if;
end $$;

-- Policy: Users can delete their own recipes (safe creation)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'recipes' and policyname = 'Users can delete their own recipes'
    ) then
        create policy "Users can delete their own recipes"
        on public.recipes for delete
        using (user_id = auth.uid());
    end if;
end $$;
