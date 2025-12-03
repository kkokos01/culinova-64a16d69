-- Create shopping list items table for Smart Shopping List feature
-- This enables users to generate grocery lists from recipes while filtering out pantry items

-- 1. Create function for updating updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create Shopping List Table
create table public.shopping_list_items (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  from_recipe_id uuid references public.recipes(id) on delete set null,
  name text not null,
  quantity text, -- Flexible text: "2 cans", "1 lb", "1 loaf"
  category text default 'Other',
  is_checked boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint shopping_list_items_pkey primary key (id)
);

-- 3. Enable RLS
alter table public.shopping_list_items enable row level security;

-- 4. Create RLS Policies that respect space-based access
-- Users can manage items in spaces they have access to
create policy "Users can manage shopping list items in their spaces" 
on public.shopping_list_items for all 
using (
  auth.uid() = user_id 
  AND (
    -- Personal items (space_id is null) - always allowed
    space_id IS NULL 
    OR 
    -- Space-based items - user must have active membership in the space
    space_id IN (
      SELECT space_id FROM user_spaces 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- 5. Create indexes for performance
create index idx_shopping_list_items_user_space on public.shopping_list_items(user_id, space_id);
create index idx_shopping_list_items_category on public.shopping_list_items(category);
create index idx_shopping_list_items_checked on public.shopping_list_items(is_checked);
create index idx_shopping_list_items_recipe on public.shopping_list_items(from_recipe_id) where from_recipe_id is not null;

-- 6. Create unique index to prevent duplicates within the same space
-- Uses coalesce to handle null space_id for personal items
create unique index idx_shopping_list_items_unique_name 
on public.shopping_list_items(user_id, coalesce(space_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

-- 7. Create trigger for updated_at
create trigger update_shopping_list_items_updated_at
  before update on public.shopping_list_items
  for each row
  execute function update_updated_at_column();
