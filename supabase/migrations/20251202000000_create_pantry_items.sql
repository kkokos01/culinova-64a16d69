-- Create pantry items table for Smart Pantry feature
-- This enables users to catalog ingredients and use them to constrain AI recipe generation

-- 1. Create function for updating updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create Enum for logical categorization
create type storage_type_enum as enum ('pantry', 'fridge', 'freezer', 'produce', 'spice');

-- 3. Create Pantry Table
create table public.pantry_items (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  name text not null,
  quantity text, -- Flexible text: "2 cans", "1 lb"
  storage_type storage_type_enum default 'pantry',
  is_staple boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pantry_items_pkey primary key (id)
);

-- 4. Enable RLS
alter table public.pantry_items enable row level security;

-- 5. Create RLS Policies
create policy "Users can manage their own pantry items" 
on public.pantry_items for all 
using (auth.uid() = user_id);

-- 6. Create indexes for performance
create index idx_pantry_items_user_storage on public.pantry_items(user_id, storage_type);
create index idx_pantry_items_space on public.pantry_items(space_id) where space_id is not null;
create index idx_pantry_items_updated on public.pantry_items(updated_at desc);

-- 7. Create trigger for updated_at
create trigger update_pantry_items_updated_at
  before update on public.pantry_items
  for each row
  execute function update_updated_at_column();
