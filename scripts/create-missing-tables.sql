-- Create missing tables in dev database
-- Run this in the dev SQL Editor

-- profiles table (if not user_profiles)
CREATE TABLE IF NOT EXISTS "public"."profiles" (
  "id" uuid NOT NULL,
  "username" text,
  "full_name" text,
  "avatar_url" text,
  "updated_at" timestamp with time zone,
  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profiles_username_key" UNIQUE ("username"),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- space_members table
CREATE TABLE IF NOT EXISTS "public"."space_members" (
  "id" uuid NOT NULL,
  "space_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL DEFAULT 'member',
  "joined_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "space_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "space_members_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE,
  CONSTRAINT "space_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- shopping_lists table
CREATE TABLE IF NOT EXISTS "public"."shopping_lists" (
  "id" uuid NOT NULL,
  "name" text NOT NULL,
  "space_id" uuid NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shopping_lists_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE,
  CONSTRAINT "shopping_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- shopping_items table (not shopping_list_items)
CREATE TABLE IF NOT EXISTS "public"."shopping_items" (
  "id" uuid NOT NULL,
  "shopping_list_id" uuid NOT NULL,
  "ingredient_name" text NOT NULL,
  "quantity" numeric,
  "unit" text,
  "checked" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shopping_items_shopping_list_id_fkey" FOREIGN KEY ("shopping_list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE CASCADE
);

-- invitations table (not space_invitations)
CREATE TABLE IF NOT EXISTS "public"."invitations" (
  "id" uuid NOT NULL,
  "space_id" uuid NOT NULL,
  "invited_by" uuid NOT NULL,
  "invited_email" text NOT NULL,
  "token" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone DEFAULT now(),
  "expires_at" timestamp with time zone,
  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invitations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE,
  CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
