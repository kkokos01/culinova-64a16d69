

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "ltree" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."measurement_system" AS ENUM (
    'metric',
    'imperial',
    'universal'
);


ALTER TYPE "public"."measurement_system" OWNER TO "postgres";


CREATE TYPE "public"."modification_type" AS ENUM (
    'manual',
    'ai',
    'dietary',
    'scaling',
    'time'
);


ALTER TYPE "public"."modification_type" OWNER TO "postgres";


CREATE TYPE "public"."property_type" AS ENUM (
    'calories',
    'protein',
    'fat',
    'carbohydrates',
    'fiber',
    'sugar',
    'sodium',
    'vitamin_a',
    'vitamin_c',
    'calcium',
    'iron'
);


ALTER TYPE "public"."property_type" OWNER TO "postgres";


CREATE TYPE "public"."storage_type_enum" AS ENUM (
    'pantry',
    'fridge',
    'freezer',
    'produce',
    'spice'
);


ALTER TYPE "public"."storage_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."unit_type" AS ENUM (
    'mass',
    'volume',
    'count',
    'temperature',
    'length',
    'area'
);


ALTER TYPE "public"."unit_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."create_default_space_for_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  space_id UUID;
  membership_id UUID;
BEGIN
  -- Debug log
  RAISE LOG 'Creating default space for user: %', NEW.user_id;
  
  -- Create a default space for the user
  INSERT INTO public.spaces (
    name, 
    created_by, 
    max_recipes, 
    max_users, 
    is_active
  ) 
  VALUES (
    'My Recipes', 
    NEW.user_id, 
    100, 
    5, 
    true
  )
  RETURNING id INTO space_id;
  
  RAISE LOG 'Space created successfully, space_id: %', space_id;
  
  -- Make the user an admin of their space with an explicit insert
  INSERT INTO public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active
  ) 
  VALUES (
    NEW.user_id, 
    space_id, 
    'admin'::text, 
    true
  )
  RETURNING id INTO membership_id;
  
  RAISE LOG 'Membership created successfully, membership_id: %', membership_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_default_space_for_user: % %', SQLSTATE, SQLERRM;
    RETURN NEW; -- Still return NEW so user creation succeeds even if space creation fails
END;
$$;


ALTER FUNCTION "private"."create_default_space_for_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."is_space_admin"("_user_id" "uuid", "_space_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_spaces
    WHERE user_id = _user_id 
      AND space_id = _space_id 
      AND role = 'admin' 
      AND is_active = true
  );
$$;


ALTER FUNCTION "private"."is_space_admin"("_user_id" "uuid", "_space_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."space_has_no_members"("_space_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM user_spaces 
    WHERE space_id = _space_id
    AND is_active = true
  );
$$;


ALTER FUNCTION "private"."space_has_no_members"("_space_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_space_invitation"("invitation_id_param" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  invitation_record RECORD;
  existing_membership RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record 
  FROM public.space_invitations 
  WHERE id = invitation_id_param AND recipient_id = auth.uid();
  
  -- If invitation doesn't exist or doesn't belong to user
  IF invitation_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found.');
  END IF;
  
  -- Check if invitation is still pending
  IF invitation_record.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Invitation is no longer valid.');
  END IF;
  
  -- Check if invitation hasn't expired
  IF invitation_record.expires_at < now() THEN
    -- Update status to expired
    UPDATE public.space_invitations 
    SET status = 'expired', updated_at = now() 
    WHERE id = invitation_id_param;
    RETURN json_build_object('success', false, 'error', 'Invitation has expired.');
  END IF;
  
  -- Check if user is already a member
  SELECT * INTO existing_membership 
  FROM public.user_spaces 
  WHERE user_id = invitation_record.recipient_id 
    AND space_id = invitation_record.space_id 
    AND is_active = true;
  
  IF existing_membership IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are already a member of this collection.');
  END IF;
  
  -- Add user to space
  INSERT INTO public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active,
    created_at
  ) VALUES (
    invitation_record.recipient_id,
    invitation_record.space_id,
    invitation_record.role,
    true,
    now()
  );
  
  -- Update invitation status
  UPDATE public.space_invitations 
  SET status = 'accepted', 
      responded_at = now(),
      updated_at = now() 
  WHERE id = invitation_id_param;
  
  -- Create activity record for the acceptance
  INSERT INTO public.activities (
    space_id,
    actor_id,
    action_type,
    entity_id,
    entity_type,
    details,
    created_at
  ) VALUES (
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
  
  RETURN json_build_object('success', true, 'message', 'Successfully joined the collection!');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."accept_space_invitation"("invitation_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_tikka_masala_recipe"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  recipe_id uuid;
  chicken_id uuid;
BEGIN
  -- First, let's create the main recipe entry
  INSERT INTO public.recipes (
    title, 
    description, 
    cook_time_minutes, 
    prep_time_minutes, 
    servings, 
    difficulty, 
    user_id, 
    privacy_level
  )
  VALUES (
    'Authentic Chicken Tikka Masala',
    'A rich and aromatic Indian curry with tender chicken pieces in a creamy tomato sauce',
    30, -- cooking time
    20, -- prep time
    4,  -- servings
    'medium', -- difficulty
    (SELECT id FROM auth.users LIMIT 1), -- get the first user
    'public'
  )
  RETURNING id INTO recipe_id;

  -- Create ingredients using existing foods or add new ones as needed
  -- First, let's check if we have chicken in the database, or add it
  SELECT id INTO chicken_id FROM foods WHERE name ILIKE '%chicken breast%' LIMIT 1;
  
  IF chicken_id IS NULL THEN
    INSERT INTO public.foods (
      name, 
      description,
      category_id,
      space_id,
      created_by
    )
    VALUES (
      'Chicken Breast', 
      'Boneless, skinless chicken breast',
      (SELECT id FROM food_categories WHERE name LIKE '%Meat%' OR name LIKE '%Protein%' LIMIT 1),
      (SELECT id FROM spaces LIMIT 1),
      (SELECT id FROM auth.users LIMIT 1)
    )
    RETURNING id INTO chicken_id;
  END IF;

  -- Add chicken
  INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
  VALUES (
    recipe_id,
    chicken_id,
    (SELECT id FROM units WHERE name = 'pound' OR abbreviation = 'lb' LIMIT 1),
    1.5,
    1
  );

  -- Helper function to add an ingredient
  DECLARE
    food_id uuid;
  BEGIN
    -- Yogurt
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%yogurt%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Plain Yogurt',
        'Plain unsweetened yogurt',
        (SELECT id FROM food_categories WHERE name LIKE '%Dairy%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'cup' LIMIT 1),
      0.5,
      2
    );

    -- Lemon Juice
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%lemon juice%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Lemon Juice',
        'Fresh lemon juice',
        (SELECT id FROM food_categories WHERE name LIKE '%Fruit%' OR name LIKE '%Condiment%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'tablespoon' OR abbreviation = 'tbsp' LIMIT 1),
      2,
      3
    );

    -- Garam Masala
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%garam masala%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Garam Masala',
        'Indian spice blend',
        (SELECT id FROM food_categories WHERE name LIKE '%Spice%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'teaspoon' OR abbreviation = 'tsp' LIMIT 1),
      1,
      4
    );

    -- Cumin
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%cumin%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Ground Cumin',
        'Ground cumin spice',
        (SELECT id FROM food_categories WHERE name LIKE '%Spice%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'teaspoon' OR abbreviation = 'tsp' LIMIT 1),
      1,
      5
    );

    -- Coriander
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%coriander%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Ground Coriander',
        'Ground coriander spice',
        (SELECT id FROM food_categories WHERE name LIKE '%Spice%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'teaspoon' OR abbreviation = 'tsp' LIMIT 1),
      1,
      6
    );

    -- Turmeric
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%turmeric%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Ground Turmeric',
        'Ground turmeric spice',
        (SELECT id FROM food_categories WHERE name LIKE '%Spice%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'teaspoon' OR abbreviation = 'tsp' LIMIT 1),
      0.5,
      7
    );

    -- Paprika
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%paprika%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Paprika',
        'Ground paprika spice',
        (SELECT id FROM food_categories WHERE name LIKE '%Spice%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'teaspoon' OR abbreviation = 'tsp' LIMIT 1),
      1,
      8
    );

    -- Garlic
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%garlic%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Garlic',
        'Fresh garlic',
        (SELECT id FROM food_categories WHERE name LIKE '%Vegetable%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'piece' OR abbreviation = 'pc' LIMIT 1),
      3,
      9
    );

    -- Ginger
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%ginger%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Fresh Ginger',
        'Fresh ginger root',
        (SELECT id FROM food_categories WHERE name LIKE '%Vegetable%' OR name LIKE '%Spice%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'tablespoon' OR abbreviation = 'tbsp' LIMIT 1),
      1,
      10
    );

    -- Tomato Sauce
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%tomato sauce%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Tomato Sauce',
        'Plain tomato sauce',
        (SELECT id FROM food_categories WHERE name LIKE '%Sauce%' OR name LIKE '%Vegetable%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'cup' LIMIT 1),
      1,
      11
    );

    -- Heavy Cream
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%heavy cream%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Heavy Cream',
        'Full-fat dairy cream',
        (SELECT id FROM food_categories WHERE name LIKE '%Dairy%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'cup' LIMIT 1),
      0.5,
      12
    );

    -- Butter
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%butter%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Butter',
        'Unsalted butter',
        (SELECT id FROM food_categories WHERE name LIKE '%Dairy%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'tablespoon' OR abbreviation = 'tbsp' LIMIT 1),
      2,
      13
    );

    -- Onion
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%onion%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Onion',
        'Yellow or white onion',
        (SELECT id FROM food_categories WHERE name LIKE '%Vegetable%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'piece' OR abbreviation = 'pc' LIMIT 1),
      1,
      14
    );

    -- Salt
    SELECT id INTO food_id FROM foods WHERE name ILIKE '%salt%' LIMIT 1;
    IF food_id IS NULL THEN
      INSERT INTO foods (name, description, category_id, space_id, created_by)
      VALUES (
        'Salt',
        'Table salt',
        (SELECT id FROM food_categories WHERE name LIKE '%Spice%' OR name LIKE '%Condiment%' LIMIT 1),
        (SELECT id FROM spaces LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
      )
      RETURNING id INTO food_id;
    END IF;
    
    INSERT INTO public.ingredients (recipe_id, food_id, unit_id, amount, order_index)
    VALUES (
      recipe_id,
      food_id,
      (SELECT id FROM units WHERE name = 'teaspoon' OR abbreviation = 'tsp' LIMIT 1),
      1,
      15
    );
  END;

  -- Add cooking steps
  INSERT INTO public.steps (recipe_id, order_number, instruction, duration_minutes)
  VALUES
  (recipe_id, 1, 'In a large bowl, combine yogurt, lemon juice, garam masala, cumin, coriander, turmeric, and paprika to make the marinade.', 5),
  (recipe_id, 2, 'Add the chicken pieces to the marinade, making sure they are well coated. Cover and refrigerate for at least 30 minutes (or up to overnight for better flavor).', 30),
  (recipe_id, 3, 'Heat butter in a large skillet over medium heat. Add the chopped onion and cook until soft and translucent, about 5 minutes.', 5),
  (recipe_id, 4, 'Add minced garlic and grated ginger, and sauté for another minute until fragrant.', 1),
  (recipe_id, 5, 'Add the marinated chicken (with the marinade) to the skillet and cook for about 10 minutes, stirring occasionally.', 10),
  (recipe_id, 6, 'Pour in the tomato sauce, stir well, and bring to a simmer. Cover and cook for 15 minutes, stirring occasionally.', 15),
  (recipe_id, 7, 'Stir in the heavy cream and salt. Simmer for another 5 minutes until the sauce thickens slightly.', 5),
  (recipe_id, 8, 'Taste and adjust seasoning if needed. Serve hot with rice or naan bread.', 2);

  RETURN recipe_id;
END;
$$;


ALTER FUNCTION "public"."add_tikka_masala_recipe"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_username_availability"("username" "text") RETURNS TABLE("is_available" boolean, "suggestions" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  base_name TEXT;
  counter INTEGER := 1;
  suggestion_list TEXT[] := '{}';
BEGIN
  -- Check if username is available
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = username) THEN
    RETURN QUERY SELECT true, ARRAY[]::TEXT[];
    RETURN;
  END IF;
  
  -- Generate suggestions
  base_name := username;
  
  -- Add numbers to username until we find available ones
  WHILE counter <= 5 LOOP
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = base_name || counter::TEXT) THEN
      suggestion_list := array_append(suggestion_list, base_name || counter::TEXT);
    END IF;
    counter := counter + 1;
  END LOOP;
  
  -- Try adding random words
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = username || '_app') THEN
    suggestion_list := array_append(suggestion_list, username || '_app');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE display_name = username || '_chef') THEN
    suggestion_list := array_append(suggestion_list, username || '_chef');
  END IF;
  
  RETURN QUERY SELECT false, suggestion_list;
END;
$$;


ALTER FUNCTION "public"."check_username_availability"("username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_invitations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.space_invitations 
  SET status = 'expired', updated_at = now() 
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_invitations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."convert_units"("input_value" numeric, "input_from_unit_id" "uuid", "input_to_unit_id" "uuid", "input_food_id" "uuid" DEFAULT NULL::"uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    conversion_rate DECIMAL;
    from_unit_name TEXT;
    to_unit_name TEXT;
    unit_type_val unit_type;
    direct_conversion RECORD;
BEGIN
    -- Get unit info - using explicit aliases to avoid ambiguity
    SELECT u.name, u.unit_type INTO from_unit_name, unit_type_val 
    FROM units u 
    WHERE u.id = input_from_unit_id;
    
    SELECT u.name INTO to_unit_name 
    FROM units u 
    WHERE u.id = input_to_unit_id;
    
    -- Special handling for temperature conversions
    IF unit_type_val = 'temperature' THEN
        -- Celsius to Fahrenheit: °F = (°C × 9/5) + 32
        IF from_unit_name = 'celsius' AND to_unit_name = 'fahrenheit' THEN
            RETURN (input_value * 9/5) + 32;
        -- Fahrenheit to Celsius: °C = (°F − 32) × 5/9
        ELSIF from_unit_name = 'fahrenheit' AND to_unit_name = 'celsius' THEN
            RETURN (input_value - 32) * 5/9;
        -- Same unit, no conversion needed
        ELSIF from_unit_name = to_unit_name THEN
            RETURN input_value;
        END IF;
    END IF;
    
    -- First try food-specific conversion
    IF input_food_id IS NOT NULL THEN
        SELECT * INTO direct_conversion
        FROM unit_conversions uc
        WHERE (
            (uc.from_unit_id = input_from_unit_id AND uc.to_unit_id = input_to_unit_id) OR
            (uc.bidirectional AND uc.from_unit_id = input_to_unit_id AND uc.to_unit_id = input_from_unit_id)
        )
        AND uc.food_id = input_food_id
        LIMIT 1;
        
        IF FOUND THEN
            IF direct_conversion.from_unit_id = input_from_unit_id THEN
                RETURN input_value * (direct_conversion.to_amount / direct_conversion.from_amount);
            ELSE
                RETURN input_value * (direct_conversion.from_amount / direct_conversion.to_amount);
            END IF;
        END IF;
    END IF;
    
    -- Then try direct conversion
    SELECT * INTO direct_conversion
    FROM unit_conversions uc
    WHERE (
        (uc.from_unit_id = input_from_unit_id AND uc.to_unit_id = input_to_unit_id) OR
        (uc.bidirectional AND uc.from_unit_id = input_to_unit_id AND uc.to_unit_id = input_from_unit_id)
    )
    AND uc.food_id IS NULL
    LIMIT 1;
    
    IF FOUND THEN
        IF direct_conversion.from_unit_id = input_from_unit_id THEN
            RETURN input_value * (direct_conversion.to_amount / direct_conversion.from_amount);
        ELSE
            RETURN input_value * (direct_conversion.from_amount / direct_conversion.to_amount);
        END IF;
    END IF;
    
    -- If no direct conversion, try through base units (except for temperature)
    IF unit_type_val != 'temperature' THEN
        DECLARE
            from_base_conv DECIMAL;
            to_base_conv DECIMAL;
        BEGIN
            SELECT u.conversion_to_base INTO from_base_conv
            FROM units u
            WHERE u.id = input_from_unit_id;
            
            SELECT u.conversion_to_base INTO to_base_conv
            FROM units u
            WHERE u.id = input_to_unit_id;
            
            IF from_base_conv IS NOT NULL AND to_base_conv IS NOT NULL THEN
                RETURN input_value * (from_base_conv / to_base_conv);
            END IF;
        END;
    END IF;
    
    -- If we get here, no conversion was possible
    RAISE EXCEPTION 'No conversion path found between % and %', from_unit_name, to_unit_name;
END;
$$;


ALTER FUNCTION "public"."convert_units"("input_value" numeric, "input_from_unit_id" "uuid", "input_to_unit_id" "uuid", "input_food_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_space_for_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  space_id UUID;
BEGIN
  -- Create a default space for the user
  INSERT INTO public.spaces (
    name, 
    created_by, 
    max_recipes, 
    max_users, 
    is_active,
    is_default
  ) 
  VALUES (
    'My Recipes', 
    NEW.user_id, 
    100, 
    5, 
    true,
    true
  )
  RETURNING id INTO space_id;
  
  -- Make the user an admin of their space
  INSERT INTO public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active
  ) 
  VALUES (
    NEW.user_id, 
    space_id, 
    'admin', 
    true
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_space_for_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_spaces_for_existing_users"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  user_record RECORD;
  space_id UUID;
  created_count INTEGER := 0;
BEGIN
  -- For each user without a space
  FOR user_record IN 
    SELECT u.id 
    FROM auth.users u
    LEFT JOIN public.spaces s ON s.created_by = u.id
    WHERE s.id IS NULL
  LOOP
    -- Create a default space
    INSERT INTO public.spaces (
      name, 
      created_by, 
      max_recipes, 
      max_users, 
      is_active,
      is_default
    ) 
    VALUES (
      'My Recipes', 
      user_record.id, 
      100, 
      5, 
      true,
      true
    )
    RETURNING id INTO space_id;
    
    -- Make the user an admin of their space
    INSERT INTO public.user_spaces (
      user_id, 
      space_id, 
      role, 
      is_active
    ) 
    VALUES (
      user_record.id, 
      space_id, 
      'admin', 
      true
    );
    
    created_count := created_count + 1;
  END LOOP;
  
  -- For users with spaces but no default space, mark their first space as default
  FOR user_record IN 
    SELECT u.id 
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.spaces 
      WHERE created_by = u.id AND is_default = true
    )
    AND EXISTS (
      SELECT 1 FROM public.spaces 
      WHERE created_by = u.id
    )
  LOOP
    UPDATE public.spaces
    SET is_default = true
    WHERE id = (
      SELECT id FROM public.spaces
      WHERE created_by = user_record.id
      ORDER BY created_at ASC
      LIMIT 1
    );
    
    created_count := created_count + 1;
  END LOOP;
  
  RETURN created_count;
END;
$$;


ALTER FUNCTION "public"."create_default_spaces_for_existing_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_food_catalog_rpcs"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- This is a no-op function that's just used to verify the RPCs exist
  RETURN 'RPC functions created successfully';
END;
$$;


ALTER FUNCTION "public"."create_food_catalog_rpcs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_mock_recipes_in_space"("space_id_param" "uuid", "user_id_param" "uuid", "count_param" integer DEFAULT 3) RETURNS SETOF "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  recipe_id UUID;
  i INTEGER;
  recipe_titles TEXT[] := ARRAY['Pasta Carbonara', 'Chicken Tikka Masala', 'Vegetable Stir Fry', 'Classic Burger', 'Caesar Salad'];
  recipe_descriptions TEXT[] := ARRAY[
    'A classic Italian pasta dish with eggs, cheese, and pancetta',
    'Aromatic Indian curry with tender chicken pieces in a creamy tomato sauce',
    'Quick and healthy mix of fresh vegetables cooked in a wok',
    'Juicy beef patty with all the fixings on a toasted bun',
    'Fresh romaine lettuce with creamy dressing, croutons, and parmesan'
  ];
BEGIN
  -- Verify the space exists and is active
  IF NOT EXISTS (SELECT 1 FROM spaces WHERE id = space_id_param AND is_active = true) THEN
    RAISE EXCEPTION 'Space with ID % does not exist or is not active', space_id_param;
  END IF;
  
  -- Verify the user exists and has access to the space
  IF NOT EXISTS (
    SELECT 1 FROM user_spaces 
    WHERE user_id = user_id_param 
    AND space_id = space_id_param 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User % does not have access to space %', user_id_param, space_id_param;
  END IF;

  FOR i IN 1..LEAST(count_param, array_length(recipe_titles, 1)) LOOP
    -- Create recipe
    INSERT INTO recipes (
      title,
      description,
      cook_time_minutes,
      prep_time_minutes,
      servings,
      difficulty,
      user_id,
      space_id,
      is_public,
      privacy_level
    )
    VALUES (
      recipe_titles[i],
      recipe_descriptions[i],
      15 + (i * 5), -- Varying cook times
      10 + i,       -- Varying prep times
      2 + (i % 4),  -- Servings between 2-5
      CASE WHEN i % 3 = 0 THEN 'easy' WHEN i % 3 = 1 THEN 'medium' ELSE 'hard' END,
      user_id_param,
      space_id_param,
      false,
      'private'
    )
    RETURNING id INTO recipe_id;
    
    -- Return the created recipe ID
    RETURN NEXT recipe_id;
    
    -- Basic ingredients - would need to be expanded with actual food/unit IDs from your database
    -- This is simplified and would need to be customized based on your actual data
    FOR j IN 1..3 LOOP
      -- You would need to verify these IDs exist in your database
      -- This is a placeholder - actual implementation would need real IDs
      INSERT INTO ingredients (recipe_id, food_id, unit_id, amount, order_index)
      SELECT 
        recipe_id,
        id,
        (SELECT id FROM units WHERE name = 'cup' LIMIT 1),
        1.0 + (j * 0.5),
        j
      FROM foods
      WHERE space_id IS NULL -- Use global foods
      LIMIT 1
      OFFSET j;
    END LOOP;
    
    -- Basic steps
    INSERT INTO steps (recipe_id, instruction, order_number, duration_minutes)
    VALUES
      (recipe_id, 'Prepare ingredients', 1, 5),
      (recipe_id, 'Cook according to instructions', 2, 10),
      (recipe_id, 'Serve and enjoy', 3, 1);
  END LOOP;
  
  RETURN;
END;
$$;


ALTER FUNCTION "public"."create_mock_recipes_in_space"("space_id_param" "uuid", "user_id_param" "uuid", "count_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_for_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_profile_for_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_space_for_existing_user"("user_id_param" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  space_id UUID;
  membership_id UUID;
BEGIN
  -- Create a default space for the user
  INSERT INTO public.spaces (
    name, 
    created_by, 
    max_recipes, 
    max_users, 
    is_active
  ) 
  VALUES (
    'My Recipes', 
    user_id_param, 
    100, 
    5, 
    true
  )
  RETURNING id INTO space_id;
  
  -- Make the user an admin of their space explicitly
  INSERT INTO public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active
  ) 
  VALUES (
    user_id_param, 
    space_id, 
    'admin'::text, 
    true
  )
  RETURNING id INTO membership_id;
  
  RETURN space_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_space_for_existing_user: % %', SQLSTATE, SQLERRM;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."create_space_for_existing_user"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile_with_username"("user_id_param" "uuid", "username_param" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert user profile with username
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (user_id_param, username_param);
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    -- Username already taken
    RETURN FALSE;
  WHEN OTHERS THEN
    -- Other error
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."create_user_profile_with_username"("user_id_param" "uuid", "username_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_or_create_food"("p_name" "text", "p_space_id" "uuid", "p_user_id" "uuid", "p_description" "text" DEFAULT NULL::"text", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_source" "text" DEFAULT 'user_input'::"text", "p_confidence" numeric DEFAULT 0.75) RETURNS TABLE("id" "uuid", "name" "text", "food_id" "uuid", "confidence_score" numeric, "is_validated" boolean, "is_new" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_food_id UUID;
  v_is_new BOOLEAN := false;
BEGIN
  -- First try exact match in the same space
  SELECT f.id INTO v_food_id
  FROM foods f
  WHERE LOWER(f.name) = LOWER(p_name)
    AND (f.space_id = p_space_id OR f.space_id IS NULL)
    AND f.is_active = true
  LIMIT 1;
  
  -- If not found, try fuzzy match in the same space
  IF v_food_id IS NULL THEN
    SELECT f.id INTO v_food_id
    FROM foods f
    WHERE 
      similarity(LOWER(f.name), LOWER(p_name)) > 0.3
      AND (f.space_id = p_space_id OR f.space_id IS NULL)
      AND f.is_active = true
    ORDER BY similarity(LOWER(f.name), LOWER(p_name)) DESC
    LIMIT 1;
  END IF;
  
  -- If still not found, create a new food entry
  IF v_food_id IS NULL THEN
    INSERT INTO foods (
      name,
      description,
      space_id,
      category_id,
      created_by,
      is_active,
      source,
      confidence_score,
      is_validated
    )
    VALUES (
      p_name,
      p_description,
      p_space_id,
      p_category_id,
      p_user_id,
      true,
      p_source,
      p_confidence,
      false
    )
    RETURNING id INTO v_food_id;
    
    v_is_new := true;
  END IF;
  
  -- Return the food information
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    v_food_id AS food_id,
    f.confidence_score,
    f.is_validated,
    v_is_new
  FROM foods f
  WHERE f.id = v_food_id;
END;
$$;


ALTER FUNCTION "public"."find_or_create_food"("p_name" "text", "p_space_id" "uuid", "p_user_id" "uuid", "p_description" "text", "p_category_id" "uuid", "p_source" "text", "p_confidence" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fix_default_spaces"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  user_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- Find users with no default space but who have spaces
  FOR user_record IN 
    SELECT DISTINCT created_by as user_id
    FROM public.spaces
    WHERE created_by NOT IN (
      SELECT created_by 
      FROM public.spaces 
      WHERE is_default = true
    )
    AND is_active = true
  LOOP
    -- Set the oldest space as default
    UPDATE public.spaces
    SET is_default = true
    WHERE id = (
      SELECT id FROM public.spaces
      WHERE created_by = user_record.user_id
      AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1
    );
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  -- Handle users with multiple default spaces
  FOR user_record IN 
    SELECT created_by as user_id, COUNT(*) as default_count
    FROM public.spaces
    WHERE is_default = true
    AND is_active = true
    GROUP BY created_by
    HAVING COUNT(*) > 1
  LOOP
    -- Keep only the oldest default space
    UPDATE public.spaces
    SET is_default = false
    WHERE created_by = user_record.user_id
    AND is_default = true
    AND id NOT IN (
      SELECT id FROM public.spaces
      WHERE created_by = user_record.user_id
      AND is_default = true
      AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1
    );
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RETURN fixed_count;
END;
$$;


ALTER FUNCTION "public"."fix_default_spaces"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_users"("user_ids" "uuid"[]) RETURNS "uuid"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  valid_users UUID[] := '{}';
  single_user UUID;
BEGIN
  -- Check each user ID and add to array if it exists in auth.users
  FOREACH single_user IN ARRAY user_ids
  LOOP
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = single_user) THEN
      valid_users := array_append(valid_users, single_user);
    END IF;
  END LOOP;
  
  RETURN valid_users;
END;
$$;


ALTER FUNCTION "public"."get_auth_users"("user_ids" "uuid"[]) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."foods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "category_id" "uuid",
    "path" "extensions"."ltree",
    "properties" "jsonb" DEFAULT '{}'::"jsonb",
    "inheritable_properties" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "search_vector_en" "tsvector",
    "search_vector_es" "tsvector",
    "default_unit_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_validated" boolean DEFAULT false,
    "confidence_score" numeric DEFAULT 1.0,
    "source" "text" DEFAULT 'system'::"text"
);


ALTER TABLE "public"."foods" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_food_ancestors"("food_path" "extensions"."ltree") RETURNS SETOF "public"."foods"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.foods
  WHERE get_food_ancestors.food_path <@ path
    AND path != get_food_ancestors.food_path
  ORDER BY path;
$$;


ALTER FUNCTION "public"."get_food_ancestors"("food_path" "extensions"."ltree") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_food_descendants"("food_path" "extensions"."ltree") RETURNS SETOF "public"."foods"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.foods
  WHERE path <@ get_food_descendants.food_path
    AND path != get_food_descendants.food_path
  ORDER BY path;
$$;


ALTER FUNCTION "public"."get_food_descendants"("food_path" "extensions"."ltree") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recipe_versions"("recipe_id_param" "uuid") RETURNS TABLE("id" "uuid", "recipe_id" "uuid", "display_name" "text", "version_number" integer, "is_current" boolean, "created_at" timestamp with time zone, "modification_type" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    rv.id,
    rv.recipe_id,
    rv.display_name,
    rv.version_number,
    rv.is_current,
    rv.created_at,
    rv.modification_type
  FROM recipe_versions rv
  WHERE rv.recipe_id = recipe_id_param
  ORDER BY rv.version_number ASC;
$$;


ALTER FUNCTION "public"."get_recipe_versions"("recipe_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recipe_with_details"("recipe_id_param" "uuid") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "cook_time_minutes" integer, "prep_time_minutes" integer, "servings" integer, "difficulty" "text", "user_id" "uuid", "space_id" "uuid", "is_public" boolean, "privacy_level" "text", "image_url" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "ingredient_id" "uuid", "ingredient_food_id" "uuid", "ingredient_unit_id" "uuid", "ingredient_amount" numeric, "ingredient_order_index" integer, "food_name" "text", "food_description" "text", "food_category_id" "uuid", "food_properties" "jsonb", "unit_name" "text", "unit_abbreviation" "text", "unit_plural_name" "text", "step_id" "uuid", "step_instruction" "text", "step_order_number" integer, "step_duration_minutes" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    r.id,
    r.title,
    r.description,
    r.cook_time_minutes,
    r.prep_time_minutes,
    r.servings,
    r.difficulty,
    r.user_id,
    r.space_id,
    r.is_public,
    r.privacy_level,
    r.image_url,
    r.created_at,
    r.updated_at,
    i.id as ingredient_id,
    i.food_id as ingredient_food_id,
    i.unit_id as ingredient_unit_id,
    i.amount as ingredient_amount,
    i.order_index as ingredient_order_index,
    f.name as food_name,
    f.description as food_description,
    f.category_id as food_category_id,
    f.properties as food_properties,
    u.name as unit_name,
    u.abbreviation as unit_abbreviation,
    u.plural_name as unit_plural_name,
    s.id as step_id,
    s.instruction as step_instruction,
    s.order_number as step_order_number,
    s.duration_minutes as step_duration_minutes
  FROM 
    recipes r
  LEFT JOIN 
    ingredients i ON r.id = i.recipe_id
  LEFT JOIN 
    foods f ON i.food_id = f.id
  LEFT JOIN 
    units u ON i.unit_id = u.id
  LEFT JOIN 
    steps s ON r.id = s.recipe_id
  WHERE 
    r.id = recipe_id_param
  ORDER BY 
    i.order_index ASC,
    s.order_number ASC;
$$;


ALTER FUNCTION "public"."get_recipe_with_details"("recipe_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_default_space"("user_id_param" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  space_id UUID;
BEGIN
  -- First try to find default space
  SELECT s.id INTO space_id
  FROM spaces s
  JOIN user_spaces us ON s.id = us.space_id
  WHERE us.user_id = user_id_param
    AND s.is_default = true
    AND us.is_active = true
    AND s.is_active = true
  LIMIT 1;
  
  -- If no default space found, get any active space
  IF space_id IS NULL THEN
    SELECT s.id INTO space_id
    FROM spaces s
    JOIN user_spaces us ON s.id = us.space_id
    WHERE us.user_id = user_id_param
      AND us.is_active = true
      AND s.is_active = true
    ORDER BY s.created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN space_id;
END;
$$;


ALTER FUNCTION "public"."get_user_default_space"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) RETURNS TABLE("user_id" "uuid", "email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Simple RETURN QUERY approach (no temporary tables)
  RETURN QUERY 
  SELECT id as user_id, email 
  FROM auth.users 
  WHERE id = ANY(user_ids);
END;
$$;


ALTER FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  username text;
  avatar text;
BEGIN
  -- Extract metadata safely
  username := new.raw_user_meta_data->>'username';
  avatar := new.raw_user_meta_data->>'avatar_url';

  -- Fallback if username is missing (prevents 500 errors)
  IF username IS NULL OR username = '' THEN
    username := 'user_' || substr(new.id::text, 1, 8);
  END IF;

  -- Insert profile
  INSERT INTO public.user_profiles (user_id, display_name, avatar_url)
  VALUES (new.id, username, avatar)
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow user creation to succeed so we can debug
  RAISE WARNING 'Error creating user profile: %', SQLERRM;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_fork_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    update public.recipes 
    set forked_count = forked_count + 1 
    where id = new.parent_recipe_id;
    return new;
end;
$$;


ALTER FUNCTION "public"."increment_fork_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text" DEFAULT 'viewer'::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  invited_user_id UUID;
  existing_membership RECORD;
  result JSON;
BEGIN
  -- Validate role
  IF user_role NOT IN ('admin', 'editor', 'viewer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role. Must be admin, editor, or viewer.');
  END IF;
  
  -- Look up user by email in auth.users
  SELECT id INTO invited_user_id 
  FROM auth.users 
  WHERE email = email_to_invite;
  
  -- If user doesn't exist, return error
  IF invited_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No user found with that email address.');
  END IF;
  
  -- Prevent users from inviting themselves
  IF invited_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'You cannot invite yourself to a collection.');
  END IF;
  
  -- Check if user is already a member
  SELECT * INTO existing_membership 
  FROM public.user_spaces 
  WHERE user_id = invited_user_id AND space_id = space_id_param AND is_active = true;
  
  -- If already a member, return appropriate message
  IF existing_membership IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'User is already a member of this collection.');
  END IF;
  
  -- Add user to space
  INSERT INTO public.user_spaces (
    user_id, 
    space_id, 
    role, 
    is_active,
    created_at
  ) VALUES (
    invited_user_id,
    space_id_param,
    user_role,
    true,
    now()
  );
  
  -- Create activity record for the invitation
  INSERT INTO public.activities (
    space_id,
    actor_id,
    action_type,
    entity_id,
    entity_type,
    details,
    created_at
  ) VALUES (
    space_id_param,
    auth.uid(),
    'user_joined',
    invited_user_id,
    'member',
    json_build_object(
      'invited_email', email_to_invite,
      'role', user_role
    ),
    now()
  );
  
  -- Return success
  RETURN json_build_object('success', true, 'message', 'User successfully added to collection.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text" DEFAULT 'viewer'::"text", "invitation_message" "text" DEFAULT NULL::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  invited_user_id UUID;
  existing_invitation RECORD;
  result JSON;
BEGIN
  -- Validate role
  IF user_role NOT IN ('admin', 'editor', 'viewer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role. Must be admin, editor, or viewer.');
  END IF;
  
  -- Look up user by email in auth.users
  SELECT id INTO invited_user_id 
  FROM auth.users 
  WHERE email = email_to_invite;
  
  -- If user doesn't exist, return error
  IF invited_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No user found with that email address.');
  END IF;
  
  -- Prevent users from inviting themselves
  IF invited_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'You cannot invite yourself to a collection.');
  END IF;
  
  -- Check if there's already a pending invitation
  SELECT * INTO existing_invitation 
  FROM public.space_invitations 
  WHERE recipient_id = invited_user_id 
    AND space_id = space_id_param 
    AND status = 'pending';
  
  -- If there's already a pending invitation, return appropriate message
  IF existing_invitation IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'User already has a pending invitation to this collection.');
  END IF;
  
  -- Check if user is already a member
  SELECT * INTO existing_invitation 
  FROM public.user_spaces 
  WHERE user_id = invited_user_id AND space_id = space_id_param AND is_active = true;
  
  -- If already a member, return appropriate message
  IF existing_invitation IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'User is already a member of this collection.');
  END IF;
  
  -- Create pending invitation
  INSERT INTO public.space_invitations (
    space_id,
    inviter_id,
    recipient_id,
    email_address,
    role,
    message,
    created_at
  ) VALUES (
    space_id_param,
    auth.uid(),
    invited_user_id,
    email_to_invite,
    user_role,
    invitation_message,
    now()
  );
  
  -- Return success
  RETURN json_build_object('success', true, 'message', 'Invitation sent successfully. User will need to accept the invitation to join the collection.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text", "invitation_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_spaces 
    WHERE user_id = is_admin.user_id 
    AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_of_space"("_user_id" "uuid", "_space_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_spaces
    WHERE user_id = _user_id
      AND space_id = _space_id
      AND is_active = true
  );
END;
$$;


ALTER FUNCTION "public"."is_member_of_space"("_user_id" "uuid", "_space_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_space_admin"("_user_id" "uuid", "_space_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN private.is_space_admin(_user_id, _space_id);
END;
$$;


ALTER FUNCTION "public"."is_space_admin"("_user_id" "uuid", "_space_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_recipes_to_default_spaces"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  updated_count INTEGER := 0;
  recipe_record RECORD;
BEGIN
  -- Find recipes without a space_id
  FOR recipe_record IN 
    SELECT r.id, r.user_id
    FROM public.recipes r
    WHERE r.space_id IS NULL
  LOOP
    -- Find the user's default space
    UPDATE public.recipes
    SET space_id = (
      SELECT s.id 
      FROM public.spaces s
      WHERE s.created_by = recipe_record.user_id
      AND s.is_default = true
      LIMIT 1
    )
    WHERE id = recipe_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."migrate_recipes_to_default_spaces"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_space_invitation"("invitation_id_param" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record 
  FROM public.space_invitations 
  WHERE id = invitation_id_param AND recipient_id = auth.uid();
  
  -- If invitation doesn't exist or doesn't belong to user
  IF invitation_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found.');
  END IF;
  
  -- Check if invitation is still pending
  IF invitation_record.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Invitation is no longer valid.');
  END IF;
  
  -- Update invitation status
  UPDATE public.space_invitations 
  SET status = 'rejected', 
      responded_at = now(),
      updated_at = now() 
  WHERE id = invitation_id_param;
  
  RETURN json_build_object('success', true, 'message', 'Invitation rejected.');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."reject_space_invitation"("invitation_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."repair_missing_memberships"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  fixed_count INTEGER := 0;
  space_rec RECORD;
BEGIN
  -- Find spaces that don't have the creator as a member
  FOR space_rec IN 
    SELECT s.id, s.created_by
    FROM public.spaces s
    LEFT JOIN public.user_spaces us ON 
      s.id = us.space_id AND 
      s.created_by = us.user_id
    WHERE us.id IS NULL AND s.is_active = true
  LOOP
    -- Create membership for the creator as admin
    INSERT INTO public.user_spaces (
      user_id, 
      space_id, 
      role, 
      is_active
    ) 
    VALUES (
      space_rec.created_by, 
      space_rec.id, 
      'admin'::text, 
      true
    );
    
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RETURN fixed_count;
END;
$$;


ALTER FUNCTION "public"."repair_missing_memberships"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_foods"("search_query" "text", "space_id" "uuid") RETURNS SETOF "public"."foods"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.foods
  WHERE space_id = search_foods.space_id
    AND (
      search_vector_en @@ websearch_to_tsquery('english', search_foods.search_query)
      OR search_vector_es @@ websearch_to_tsquery('spanish', search_foods.search_query)
    )
  ORDER BY ts_rank(search_vector_en, websearch_to_tsquery('english', search_foods.search_query)) DESC
  LIMIT 50;
$$;


ALTER FUNCTION "public"."search_foods"("search_query" "text", "space_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."text2ltree_wrapper"("text_input" "text") RETURNS "extensions"."ltree"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN text2ltree(text_input);
END;
$$;


ALTER FUNCTION "public"."text2ltree_wrapper"("text_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_food_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update path using our wrapper function instead of direct text2ltree
  IF NEW.parent_id IS NOT NULL THEN
    SELECT path INTO NEW.path 
    FROM public.foods 
    WHERE id = NEW.parent_id;
    NEW.path := NEW.path || public.text2ltree_wrapper(lower(regexp_replace(NEW.name, '\s+', '_', 'g')));
  ELSE
    NEW.path := public.text2ltree_wrapper(lower(regexp_replace(NEW.name, '\s+', '_', 'g')));
  END IF;

  -- Update search vectors
  NEW.search_vector_en := setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
                          setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                          setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')), 'C');
                         
  NEW.search_vector_es := setweight(to_tsvector('spanish', COALESCE(NEW.name, '')), 'A') ||
                          setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
                          setweight(to_tsvector('spanish', array_to_string(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')), 'C');

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_food_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_food_path_function"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only update path if it's null and we have a name
  -- Use our text2ltree_wrapper instead of direct text2ltree
  IF NEW.path IS NULL AND NEW.name IS NOT NULL THEN
    NEW.path := public.text2ltree_wrapper(LOWER(NEW.name));
  END IF;
  
  -- Also update search vectors if needed
  IF NEW.search_vector_en IS NULL AND NEW.name IS NOT NULL THEN
    NEW.search_vector_en := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  END IF;
  
  IF NEW.search_vector_es IS NULL AND NEW.name IS NOT NULL THEN
    NEW.search_vector_es := to_tsvector('spanish', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_food_path_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_base_unit_ref"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.units 
        WHERE id = NEW.base_unit_id AND base_unit = true
    ) THEN
        RAISE EXCEPTION 'base_unit_id must reference a base unit';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_base_unit_ref"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_unit_conversion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    from_type unit_type;
    to_type unit_type;
BEGIN
    -- Get unit types
    SELECT unit_type INTO from_type FROM units WHERE id = NEW.from_unit_id;
    SELECT unit_type INTO to_type FROM units WHERE id = NEW.to_unit_id;
    
    -- Check if unit types match or food-specific
    IF NEW.food_id IS NULL AND from_type != to_type THEN
        RAISE EXCEPTION 'Cannot convert between different unit types unless food-specific';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_unit_conversion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_unit_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Basic validation without user_id ambiguity
  IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Unit name cannot be empty';
  END IF;
  IF NEW.abbreviation IS NULL OR LENGTH(TRIM(NEW.abbreviation)) = 0 THEN
    RAISE EXCEPTION 'Unit abbreviation cannot be empty';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_unit_creation"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid",
    "actor_id" "uuid",
    "action_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_type" "text" DEFAULT 'recipe'::"text",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activities_action_type_check" CHECK (("action_type" = ANY (ARRAY['recipe_created'::"text", 'recipe_modified'::"text", 'recipe_forked'::"text", 'user_joined'::"text"]))),
    CONSTRAINT "activities_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['recipe'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "plural_name" "text" NOT NULL,
    "abbreviation" "text" NOT NULL,
    "unit_type" "public"."unit_type" NOT NULL,
    "base_unit_id" "uuid" NOT NULL,
    "conversion_to_base" numeric NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_units_conversion_to_base_check" CHECK (("conversion_to_base" > (0)::numeric))
);


ALTER TABLE "public"."custom_units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."food_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon_url" "text",
    "group_name" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."food_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."food_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "food_id" "uuid",
    "property_type" "public"."property_type" NOT NULL,
    "value" numeric NOT NULL,
    "unit_id" "uuid",
    "per_amount" numeric DEFAULT 100.0,
    "per_unit_id" "uuid",
    "source" "text",
    "confidence_score" numeric,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "food_properties_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric)))
);


ALTER TABLE "public"."food_properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "food_id" "uuid",
    "unit_id" "uuid",
    "amount" numeric NOT NULL,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "food_name" "text",
    "unit_name" "text"
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pantry_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "space_id" "uuid",
    "name" "text" NOT NULL,
    "quantity" "text",
    "storage_type" "public"."storage_type_enum" DEFAULT 'pantry'::"public"."storage_type_enum",
    "is_staple" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pantry_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_version_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version_id" "uuid" NOT NULL,
    "food_id" "uuid",
    "unit_id" "uuid",
    "amount" numeric NOT NULL,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."recipe_version_ingredients" REPLICA IDENTITY FULL;


ALTER TABLE "public"."recipe_version_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_version_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version_id" "uuid" NOT NULL,
    "order_number" integer NOT NULL,
    "instruction" "text" NOT NULL,
    "duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."recipe_version_steps" REPLICA IDENTITY FULL;


ALTER TABLE "public"."recipe_version_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "parent_version_id" "uuid",
    "version_number" integer NOT NULL,
    "modification_type" "text" NOT NULL,
    "modification_parameters" "jsonb",
    "is_current" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "display_name" "text" NOT NULL
);

ALTER TABLE ONLY "public"."recipe_versions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."recipe_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "prep_time_minutes" integer NOT NULL,
    "cook_time_minutes" integer NOT NULL,
    "servings" integer NOT NULL,
    "difficulty" "text" NOT NULL,
    "image_url" "text",
    "user_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "privacy_level" "text" DEFAULT 'private'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "space_id" "uuid",
    "parent_recipe_id" "uuid",
    "calories_per_serving" integer,
    "forked_count" integer DEFAULT 0,
    CONSTRAINT "recipes_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['easy'::"text", 'medium'::"text", 'hard'::"text"]))),
    CONSTRAINT "recipes_privacy_level_check" CHECK (("privacy_level" = ANY (ARRAY['private'::"text", 'space'::"text", 'public'::"text", 'shared'::"text"])))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."recipes"."parent_recipe_id" IS 'References the original recipe this was derived from (for saved modifications)';



COMMENT ON COLUMN "public"."recipes"."calories_per_serving" IS 'AI-estimated calorie count per serving (nullable)';



CREATE TABLE IF NOT EXISTS "public"."schema_migrations" (
    "version" "text" NOT NULL,
    "description" "text" NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "success" boolean DEFAULT true,
    "rollback_script" "text"
);


ALTER TABLE "public"."schema_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "space_id" "uuid",
    "from_recipe_id" "uuid",
    "name" "text" NOT NULL,
    "quantity" "text",
    "category" "text" DEFAULT 'Other'::"text",
    "is_checked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shopping_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."space_category_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid",
    "category_id" "uuid",
    "custom_name" "text",
    "custom_icon_url" "text",
    "custom_order" integer DEFAULT 0,
    "is_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."space_category_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."space_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "email_address" "text" NOT NULL,
    "role" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "message" "text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    CONSTRAINT "space_invitations_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'editor'::"text", 'viewer'::"text"]))),
    CONSTRAINT "space_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."space_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."space_invitations" IS 'Pending invitations for users to join spaces, requiring approval';



COMMENT ON COLUMN "public"."space_invitations"."status" IS 'Invitation status: pending, accepted, rejected, expired';



COMMENT ON COLUMN "public"."space_invitations"."expires_at" IS 'When the invitation automatically expires';



COMMENT ON COLUMN "public"."space_invitations"."responded_at" IS 'When the user responded to the invitation';



CREATE TABLE IF NOT EXISTS "public"."spaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "max_recipes" integer DEFAULT 100 NOT NULL,
    "max_users" integer DEFAULT 5 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_public" boolean DEFAULT false,
    "description" "text",
    "member_count" integer DEFAULT 1,
    "recipe_count" integer DEFAULT 0
);


ALTER TABLE "public"."spaces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "order_number" integer NOT NULL,
    "instruction" "text" NOT NULL,
    "duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unit_conversions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_unit_id" "uuid" NOT NULL,
    "to_unit_id" "uuid" NOT NULL,
    "food_id" "uuid",
    "from_amount" numeric NOT NULL,
    "to_amount" numeric NOT NULL,
    "bidirectional" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confidence_score" numeric,
    "source" "text",
    "is_verified" boolean DEFAULT false,
    "notes" "text",
    CONSTRAINT "no_self_conversion" CHECK (("from_unit_id" <> "to_unit_id")),
    CONSTRAINT "unit_conversions_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric))),
    CONSTRAINT "unit_conversions_from_amount_check" CHECK (("from_amount" > (0)::numeric)),
    CONSTRAINT "unit_conversions_to_amount_check" CHECK (("to_amount" > (0)::numeric))
);


ALTER TABLE "public"."unit_conversions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "plural_name" "text" NOT NULL,
    "abbreviation" "text" NOT NULL,
    "common_name" "text",
    "alternative_names" "text"[],
    "unit_type" "public"."unit_type" NOT NULL,
    "measurement_system" "public"."measurement_system" NOT NULL,
    "base_unit" boolean DEFAULT false NOT NULL,
    "conversion_to_base" numeric,
    "display_order" integer DEFAULT 0 NOT NULL,
    "formatting_template" "text" DEFAULT '%v %u'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "preferred_units" "text" DEFAULT 'metric'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "default_unit_system" "text" DEFAULT 'metric'::"text",
    "theme_preference" "text" DEFAULT 'light'::"text",
    "default_servings" integer DEFAULT 2,
    "show_nutritional_info" boolean DEFAULT true,
    CONSTRAINT "user_profiles_default_unit_system_check" CHECK (("default_unit_system" = ANY (ARRAY['metric'::"text", 'imperial'::"text"]))),
    CONSTRAINT "user_profiles_theme_preference_check" CHECK (("theme_preference" = ANY (ARRAY['light'::"text", 'dark'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_spaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "space_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_spaces_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."user_spaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_units"
    ADD CONSTRAINT "custom_units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."food_categories"
    ADD CONSTRAINT "food_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."food_categories"
    ADD CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."food_properties"
    ADD CONSTRAINT "food_properties_food_id_property_type_per_amount_per_unit_i_key" UNIQUE ("food_id", "property_type", "per_amount", "per_unit_id");



ALTER TABLE ONLY "public"."food_properties"
    ADD CONSTRAINT "food_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_space_id_name_parent_id_key" UNIQUE ("space_id", "name", "parent_id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pantry_items"
    ADD CONSTRAINT "pantry_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_version_ingredients"
    ADD CONSTRAINT "recipe_version_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_version_steps"
    ADD CONSTRAINT "recipe_version_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_versions"
    ADD CONSTRAINT "recipe_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."space_category_settings"
    ADD CONSTRAINT "space_category_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."space_category_settings"
    ADD CONSTRAINT "space_category_settings_space_id_category_id_key" UNIQUE ("space_id", "category_id");



ALTER TABLE ONLY "public"."space_invitations"
    ADD CONSTRAINT "space_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spaces"
    ADD CONSTRAINT "spaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."steps"
    ADD CONSTRAINT "steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unit_conversions"
    ADD CONSTRAINT "unique_conversion" UNIQUE ("from_unit_id", "to_unit_id", "food_id");



ALTER TABLE ONLY "public"."custom_units"
    ADD CONSTRAINT "unique_custom_unit_abbrev" UNIQUE ("space_id", "abbreviation", "unit_type");



ALTER TABLE ONLY "public"."custom_units"
    ADD CONSTRAINT "unique_custom_unit_name" UNIQUE ("space_id", "name", "unit_type");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "unique_unit_abbrev" UNIQUE ("abbreviation", "unit_type");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "unique_unit_name" UNIQUE ("name", "unit_type");



ALTER TABLE ONLY "public"."unit_conversions"
    ADD CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_display_name_unique" UNIQUE ("display_name");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_spaces"
    ADD CONSTRAINT "user_spaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_spaces"
    ADD CONSTRAINT "user_spaces_user_id_space_id_key" UNIQUE ("user_id", "space_id");



CREATE INDEX "idx_activities_actor" ON "public"."activities" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "idx_activities_space_created" ON "public"."activities" USING "btree" ("space_id", "created_at" DESC);



CREATE INDEX "idx_custom_units_space" ON "public"."custom_units" USING "btree" ("space_id");



CREATE INDEX "idx_food_properties_food_id" ON "public"."food_properties" USING "btree" ("food_id");



CREATE INDEX "idx_food_properties_type" ON "public"."food_properties" USING "btree" ("property_type");



CREATE INDEX "idx_foods_category_id" ON "public"."foods" USING "btree" ("category_id");



CREATE INDEX "idx_foods_parent_id" ON "public"."foods" USING "btree" ("parent_id");



CREATE INDEX "idx_foods_path" ON "public"."foods" USING "gist" ("path");



CREATE INDEX "idx_foods_search_en" ON "public"."foods" USING "gin" ("search_vector_en");



CREATE INDEX "idx_foods_search_es" ON "public"."foods" USING "gin" ("search_vector_es");



CREATE INDEX "idx_foods_space_id" ON "public"."foods" USING "btree" ("space_id");



CREATE INDEX "idx_pantry_items_space" ON "public"."pantry_items" USING "btree" ("space_id") WHERE ("space_id" IS NOT NULL);



CREATE INDEX "idx_pantry_items_updated" ON "public"."pantry_items" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_pantry_items_user_storage" ON "public"."pantry_items" USING "btree" ("user_id", "storage_type");



CREATE INDEX "idx_recipe_versions_current" ON "public"."recipe_versions" USING "btree" ("recipe_id", "is_current");



CREATE INDEX "idx_recipe_versions_recipe_id" ON "public"."recipe_versions" USING "btree" ("recipe_id");



CREATE INDEX "idx_recipes_created_at" ON "public"."recipes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_recipes_is_public" ON "public"."recipes" USING "btree" ("is_public");



CREATE INDEX "idx_recipes_parent_recipe_id" ON "public"."recipes" USING "btree" ("parent_recipe_id");



CREATE INDEX "idx_recipes_space_created" ON "public"."recipes" USING "btree" ("space_id", "created_at" DESC);



CREATE INDEX "idx_recipes_space_id" ON "public"."recipes" USING "btree" ("space_id");



CREATE INDEX "idx_recipes_user_created" ON "public"."recipes" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_recipes_user_id" ON "public"."recipes" USING "btree" ("user_id");



CREATE INDEX "idx_shopping_list_items_category" ON "public"."shopping_list_items" USING "btree" ("category");



CREATE INDEX "idx_shopping_list_items_checked" ON "public"."shopping_list_items" USING "btree" ("is_checked");



CREATE INDEX "idx_shopping_list_items_recipe" ON "public"."shopping_list_items" USING "btree" ("from_recipe_id") WHERE ("from_recipe_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_shopping_list_items_unique_name" ON "public"."shopping_list_items" USING "btree" ("user_id", COALESCE("space_id", '00000000-0000-0000-0000-000000000000'::"uuid"), "lower"("name"));



CREATE INDEX "idx_shopping_list_items_user_space" ON "public"."shopping_list_items" USING "btree" ("user_id", "space_id");



CREATE INDEX "idx_space_category_settings_space_id" ON "public"."space_category_settings" USING "btree" ("space_id");



CREATE INDEX "idx_space_invitations_expires_at" ON "public"."space_invitations" USING "btree" ("expires_at");



CREATE INDEX "idx_space_invitations_recipient_status" ON "public"."space_invitations" USING "btree" ("recipient_id", "status");



CREATE INDEX "idx_space_invitations_space_id" ON "public"."space_invitations" USING "btree" ("space_id");



CREATE INDEX "idx_spaces_public_active" ON "public"."spaces" USING "btree" ("is_public", "is_active") WHERE (("is_public" = true) AND ("is_active" = true));



CREATE INDEX "idx_unit_conversions_food" ON "public"."unit_conversions" USING "btree" ("food_id") WHERE ("food_id" IS NOT NULL);



CREATE INDEX "idx_unit_conversions_lookup" ON "public"."unit_conversions" USING "btree" ("from_unit_id", "to_unit_id");



CREATE INDEX "idx_units_base" ON "public"."units" USING "btree" ("id") WHERE ("base_unit" = true);



CREATE INDEX "idx_units_system" ON "public"."units" USING "btree" ("measurement_system");



CREATE INDEX "idx_units_type" ON "public"."units" USING "btree" ("unit_type");



CREATE INDEX "idx_version_ingredients_version_id" ON "public"."recipe_version_ingredients" USING "btree" ("version_id");



CREATE INDEX "idx_version_steps_version_id" ON "public"."recipe_version_steps" USING "btree" ("version_id");



CREATE UNIQUE INDEX "user_default_space_idx" ON "public"."spaces" USING "btree" ("created_by") WHERE ("is_default" = true);



CREATE OR REPLACE TRIGGER "create_default_space_on_profile_create" AFTER INSERT ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "private"."create_default_space_for_user"();



CREATE OR REPLACE TRIGGER "trg_update_food_categories_timestamp" BEFORE UPDATE ON "public"."food_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "trg_update_food_properties_timestamp" BEFORE UPDATE ON "public"."food_properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "trg_update_space_category_settings_timestamp" BEFORE UPDATE ON "public"."space_category_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();



CREATE OR REPLACE TRIGGER "trigger_increment_fork_count" AFTER INSERT ON "public"."recipes" FOR EACH ROW WHEN (("new"."parent_recipe_id" IS NOT NULL)) EXECUTE FUNCTION "public"."increment_fork_count"();



CREATE OR REPLACE TRIGGER "update_custom_units_timestamp" BEFORE UPDATE ON "public"."custom_units" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_pantry_items_updated_at" BEFORE UPDATE ON "public"."pantry_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shopping_list_items_updated_at" BEFORE UPDATE ON "public"."shopping_list_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_unit_conversions_timestamp" BEFORE UPDATE ON "public"."unit_conversions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_units_timestamp" BEFORE UPDATE ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "validate_base_unit_trigger" BEFORE INSERT OR UPDATE ON "public"."custom_units" FOR EACH ROW EXECUTE FUNCTION "public"."validate_base_unit_ref"();



CREATE OR REPLACE TRIGGER "validate_unit_conversion_trigger" BEFORE INSERT OR UPDATE ON "public"."unit_conversions" FOR EACH ROW EXECUTE FUNCTION "public"."validate_unit_conversion"();



CREATE OR REPLACE TRIGGER "validate_unit_on_insert" BEFORE INSERT ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."validate_unit_creation"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_units"
    ADD CONSTRAINT "custom_units_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."custom_units"
    ADD CONSTRAINT "custom_units_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id");



ALTER TABLE ONLY "public"."food_properties"
    ADD CONSTRAINT "food_properties_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."food_properties"
    ADD CONSTRAINT "food_properties_per_unit_id_fkey" FOREIGN KEY ("per_unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."food_properties"
    ADD CONSTRAINT "food_properties_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id");



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_default_unit_id_fkey" FOREIGN KEY ("default_unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."foods"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."foods"
    ADD CONSTRAINT "foods_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."pantry_items"
    ADD CONSTRAINT "pantry_items_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pantry_items"
    ADD CONSTRAINT "pantry_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_version_ingredients"
    ADD CONSTRAINT "recipe_version_ingredients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id");



ALTER TABLE ONLY "public"."recipe_version_ingredients"
    ADD CONSTRAINT "recipe_version_ingredients_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."recipe_version_ingredients"
    ADD CONSTRAINT "recipe_version_ingredients_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."recipe_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_version_steps"
    ADD CONSTRAINT "recipe_version_steps_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."recipe_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_versions"
    ADD CONSTRAINT "recipe_versions_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "public"."recipe_versions"("id");



ALTER TABLE ONLY "public"."recipe_versions"
    ADD CONSTRAINT "recipe_versions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_parent_recipe_id_fkey" FOREIGN KEY ("parent_recipe_id") REFERENCES "public"."recipes"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id");



ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_from_recipe_id_fkey" FOREIGN KEY ("from_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_list_items"
    ADD CONSTRAINT "shopping_list_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."space_category_settings"
    ADD CONSTRAINT "space_category_settings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."space_category_settings"
    ADD CONSTRAINT "space_category_settings_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."space_invitations"
    ADD CONSTRAINT "space_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."space_invitations"
    ADD CONSTRAINT "space_invitations_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."space_invitations"
    ADD CONSTRAINT "space_invitations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spaces"
    ADD CONSTRAINT "spaces_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."steps"
    ADD CONSTRAINT "steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_spaces"
    ADD CONSTRAINT "user_spaces_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id");



ALTER TABLE ONLY "public"."user_spaces"
    ADD CONSTRAINT "user_spaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can create invitations" ON "public"."space_invitations" FOR INSERT WITH CHECK ((("inviter_id" = "auth"."uid"()) AND ("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true) AND ("user_spaces"."role" = 'admin'::"text"))))));



CREATE POLICY "Allow deleting space memberships by admin or self" ON "public"."user_spaces" FOR DELETE TO "authenticated" USING (("private"."is_space_admin"("auth"."uid"(), "space_id") OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Allow inserting space memberships by admins or creator" ON "public"."user_spaces" FOR INSERT TO "authenticated" WITH CHECK (((("user_id" = "auth"."uid"()) AND ("role" = 'admin'::"text") AND "private"."space_has_no_members"("space_id")) OR "private"."is_space_admin"("auth"."uid"(), "space_id")));



CREATE POLICY "Allow updating space memberships by admins" ON "public"."user_spaces" FOR UPDATE TO "authenticated" USING ("private"."is_space_admin"("auth"."uid"(), "space_id")) WITH CHECK ("private"."is_space_admin"("auth"."uid"(), "space_id"));



CREATE POLICY "Allow viewing own or managed space memberships" ON "public"."user_spaces" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "private"."is_space_admin"("auth"."uid"(), "space_id")));



CREATE POLICY "Enable delete for all authenticated users" ON "public"."foods" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for all authenticated users" ON "public"."units" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for spaces based on membership" ON "public"."spaces" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."role" = 'admin'::"text") AND ("user_spaces"."is_active" = true))))));



CREATE POLICY "Enable delete for user's own memberships" ON "public"."user_spaces" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Enable insert for all authenticated users" ON "public"."foods" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for all authenticated users" ON "public"."units" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for spaces" ON "public"."spaces" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for user's own memberships" ON "public"."user_spaces" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Enable read access for all authenticated users" ON "public"."foods" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all authenticated users" ON "public"."units" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for spaces via memberships" ON "public"."spaces" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true))))));



CREATE POLICY "Enable read access for user's own memberships" ON "public"."user_spaces" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Enable update for all authenticated users" ON "public"."foods" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for all authenticated users" ON "public"."units" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for spaces based on membership" ON "public"."spaces" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."role" = 'admin'::"text") AND ("user_spaces"."is_active" = true))))));



CREATE POLICY "Enable update for user's own memberships" ON "public"."user_spaces" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Food categories: modify for admin" ON "public"."food_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."role" = 'admin'::"text")))));



CREATE POLICY "Food categories: select for all users" ON "public"."food_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Food properties: modify by admin or editor" ON "public"."food_properties" TO "authenticated" USING (("food_id" IN ( SELECT "foods"."id"
   FROM "public"."foods"
  WHERE ("foods"."space_id" IN ( SELECT "user_spaces"."space_id"
           FROM "public"."user_spaces"
          WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true) AND ("user_spaces"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))))));



CREATE POLICY "Food properties: select by food space" ON "public"."food_properties" FOR SELECT TO "authenticated" USING (("food_id" IN ( SELECT "foods"."id"
   FROM "public"."foods"
  WHERE ("foods"."space_id" IN ( SELECT "user_spaces"."space_id"
           FROM "public"."user_spaces"
          WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true)))))));



CREATE POLICY "Only admins can manage schema migrations" ON "public"."schema_migrations" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Public recipes are readable by everyone" ON "public"."recipes" FOR SELECT USING (("privacy_level" = 'public'::"text"));



CREATE POLICY "Space category settings: modify by admin or editor" ON "public"."space_category_settings" TO "authenticated" USING (("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true) AND ("user_spaces"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))));



CREATE POLICY "Space category settings: select by space" ON "public"."space_category_settings" FOR SELECT TO "authenticated" USING (("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true)))));



CREATE POLICY "Space creators can update their spaces" ON "public"."spaces" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can add ingredients to their recipes" ON "public"."ingredients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "ingredients"."recipe_id") AND ("recipes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can add steps to their recipes" ON "public"."steps" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "steps"."recipe_id") AND ("recipes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create recipes in their spaces" ON "public"."recipes" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true)))) OR ("space_id" IS NULL))));



CREATE POLICY "Users can create spaces" ON "public"."spaces" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create their own recipes" ON "public"."recipes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create versions of their recipes" ON "public"."recipe_versions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "recipe_versions"."recipe_id") AND ("recipes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete ingredients from their recipes" ON "public"."ingredients" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "ingredients"."recipe_id") AND ("recipes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete recipe version ingredients for their own versi" ON "public"."recipe_version_ingredients" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_ingredients"."version_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete recipe version steps for their own versions" ON "public"."recipe_version_steps" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_steps"."version_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete recipe versions for their own recipes" ON "public"."recipe_versions" FOR DELETE USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."recipes" "r"
  WHERE (("r"."id" = "recipe_versions"."recipe_id") AND ("r"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete steps from their recipes" ON "public"."steps" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "steps"."recipe_id") AND ("recipes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own recipes" ON "public"."recipes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own activities" ON "public"."activities" FOR INSERT WITH CHECK (("actor_id" = "auth"."uid"()));



CREATE POLICY "Users can insert recipe version ingredients for their own versi" ON "public"."recipe_version_ingredients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_ingredients"."version_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert recipe version steps for their own versions" ON "public"."recipe_version_steps" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_steps"."version_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert recipe versions for their own recipes" ON "public"."recipe_versions" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."recipes" "r"
  WHERE (("r"."id" = "recipe_versions"."recipe_id") AND ("r"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage shopping list items in their spaces" ON "public"."shopping_list_items" USING ((("auth"."uid"() = "user_id") AND (("space_id" IS NULL) OR ("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true)))))));



CREATE POLICY "Users can manage their own pantry items" ON "public"."pantry_items" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read recipes in their spaces" ON "public"."recipes" FOR SELECT USING (("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true)))));



CREATE POLICY "Users can read their own recipes" ON "public"."recipes" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update ingredients in their recipes" ON "public"."ingredients" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "ingredients"."recipe_id") AND ("recipes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own invitations" ON "public"."space_invitations" FOR UPDATE USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can update recipe version ingredients for their own versi" ON "public"."recipe_version_ingredients" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_ingredients"."version_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update recipe version steps for their own versions" ON "public"."recipe_version_steps" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_steps"."version_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update recipe versions for their own recipes" ON "public"."recipe_versions" FOR UPDATE USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."recipes" "r"
  WHERE (("r"."id" = "recipe_versions"."recipe_id") AND ("r"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update steps in their recipes" ON "public"."steps" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "steps"."recipe_id") AND ("recipes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own recipes" ON "public"."recipes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view ingredients for accessible recipes" ON "public"."ingredients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "ingredients"."recipe_id") AND (("recipes"."user_id" = "auth"."uid"()) OR ("recipes"."is_public" = true))))));



CREATE POLICY "Users can view own invitations" ON "public"."space_invitations" FOR SELECT USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can view public recipes" ON "public"."recipes" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Users can view recipe version ingredients for versions they hav" ON "public"."recipe_version_ingredients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_ingredients"."version_id") AND (("r"."user_id" = "auth"."uid"()) OR ("r"."is_public" = true) OR (("r"."space_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."user_spaces" "us"
          WHERE (("us"."space_id" = "r"."space_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."is_active" = true))))))))));



CREATE POLICY "Users can view recipe version steps for versions they have acce" ON "public"."recipe_version_steps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_steps"."version_id") AND (("r"."user_id" = "auth"."uid"()) OR ("r"."is_public" = true) OR (("r"."space_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."user_spaces" "us"
          WHERE (("us"."space_id" = "r"."space_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."is_active" = true))))))))));



CREATE POLICY "Users can view recipe versions for recipes they have access to" ON "public"."recipe_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recipes" "r"
  WHERE (("r"."id" = "recipe_versions"."recipe_id") AND (("r"."user_id" = "auth"."uid"()) OR ("r"."is_public" = true) OR (("r"."space_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."user_spaces" "us"
          WHERE (("us"."space_id" = "r"."space_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."is_active" = true))))))))));



CREATE POLICY "Users can view sent invitations" ON "public"."space_invitations" FOR SELECT USING ((("inviter_id" = "auth"."uid"()) AND ("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true) AND ("user_spaces"."role" = 'admin'::"text"))))));



CREATE POLICY "Users can view space activities" ON "public"."activities" FOR SELECT USING (("space_id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true)))));



CREATE POLICY "Users can view steps for accessible recipes" ON "public"."steps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "steps"."recipe_id") AND (("recipes"."user_id" = "auth"."uid"()) OR ("recipes"."is_public" = true))))));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own recipes" ON "public"."recipes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their spaces" ON "public"."spaces" FOR SELECT USING (("id" IN ( SELECT "user_spaces"."space_id"
   FROM "public"."user_spaces"
  WHERE (("user_spaces"."user_id" = "auth"."uid"()) AND ("user_spaces"."is_active" = true)))));



CREATE POLICY "Users can view version ingredients for accessible recipes" ON "public"."recipe_version_ingredients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_ingredients"."version_id") AND (("r"."user_id" = "auth"."uid"()) OR ("r"."is_public" = true))))));



CREATE POLICY "Users can view version steps for accessible recipes" ON "public"."recipe_version_steps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."recipe_versions" "rv"
     JOIN "public"."recipes" "r" ON (("r"."id" = "rv"."recipe_id")))
  WHERE (("rv"."id" = "recipe_version_steps"."version_id") AND (("r"."user_id" = "auth"."uid"()) OR ("r"."is_public" = true))))));



CREATE POLICY "Users can view versions of accessible recipes" ON "public"."recipe_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "recipe_versions"."recipe_id") AND (("recipes"."user_id" = "auth"."uid"()) OR ("recipes"."is_public" = true))))));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_units" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."food_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."food_properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "manage_custom_units" ON "public"."custom_units" USING ((EXISTS ( SELECT 1
   FROM "public"."user_spaces" "us"
  WHERE (("us"."space_id" = "custom_units"."space_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"])) AND ("us"."is_active" = true)))));



ALTER TABLE "public"."pantry_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_conversions" ON "public"."unit_conversions" FOR SELECT USING (true);



CREATE POLICY "read_custom_units" ON "public"."custom_units" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_spaces" "us"
  WHERE (("us"."space_id" = "custom_units"."space_id") AND ("us"."user_id" = "auth"."uid"()) AND ("us"."is_active" = true)))));



ALTER TABLE "public"."recipe_version_ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipe_version_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipe_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."space_category_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."space_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spaces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "spaces_insert_policy" ON "public"."spaces" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "spaces_select_policy" ON "public"."spaces" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR "public"."is_member_of_space"("auth"."uid"(), "id")));



ALTER TABLE "public"."steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unit_conversions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_spaces" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recipe_version_ingredients";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recipe_version_steps";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recipe_versions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






























































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."accept_space_invitation"("invitation_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_space_invitation"("invitation_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_space_invitation"("invitation_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_tikka_masala_recipe"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_tikka_masala_recipe"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_tikka_masala_recipe"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_username_availability"("username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_username_availability"("username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_username_availability"("username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_invitations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."convert_units"("input_value" numeric, "input_from_unit_id" "uuid", "input_to_unit_id" "uuid", "input_food_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."convert_units"("input_value" numeric, "input_from_unit_id" "uuid", "input_to_unit_id" "uuid", "input_food_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."convert_units"("input_value" numeric, "input_from_unit_id" "uuid", "input_to_unit_id" "uuid", "input_food_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_space_for_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_space_for_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_space_for_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_spaces_for_existing_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_spaces_for_existing_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_spaces_for_existing_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_food_catalog_rpcs"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_food_catalog_rpcs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_food_catalog_rpcs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_mock_recipes_in_space"("space_id_param" "uuid", "user_id_param" "uuid", "count_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_mock_recipes_in_space"("space_id_param" "uuid", "user_id_param" "uuid", "count_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_mock_recipes_in_space"("space_id_param" "uuid", "user_id_param" "uuid", "count_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_for_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_for_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_for_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_space_for_existing_user"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_space_for_existing_user"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_space_for_existing_user"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile_with_username"("user_id_param" "uuid", "username_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile_with_username"("user_id_param" "uuid", "username_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile_with_username"("user_id_param" "uuid", "username_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_or_create_food"("p_name" "text", "p_space_id" "uuid", "p_user_id" "uuid", "p_description" "text", "p_category_id" "uuid", "p_source" "text", "p_confidence" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."find_or_create_food"("p_name" "text", "p_space_id" "uuid", "p_user_id" "uuid", "p_description" "text", "p_category_id" "uuid", "p_source" "text", "p_confidence" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_or_create_food"("p_name" "text", "p_space_id" "uuid", "p_user_id" "uuid", "p_description" "text", "p_category_id" "uuid", "p_source" "text", "p_confidence" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_default_spaces"() TO "anon";
GRANT ALL ON FUNCTION "public"."fix_default_spaces"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_default_spaces"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_users"("user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_users"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_users"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON TABLE "public"."foods" TO "anon";
GRANT ALL ON TABLE "public"."foods" TO "authenticated";
GRANT ALL ON TABLE "public"."foods" TO "service_role";









GRANT ALL ON FUNCTION "public"."get_recipe_versions"("recipe_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_recipe_versions"("recipe_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recipe_versions"("recipe_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recipe_with_details"("recipe_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_recipe_with_details"("recipe_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recipe_with_details"("recipe_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_default_space"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_default_space"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_default_space"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_fork_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_fork_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_fork_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text", "invitation_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text", "invitation_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_user_to_space"("email_to_invite" "text", "space_id_param" "uuid", "user_role" "text", "invitation_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of_space"("_user_id" "uuid", "_space_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of_space"("_user_id" "uuid", "_space_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of_space"("_user_id" "uuid", "_space_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_space_admin"("_user_id" "uuid", "_space_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_space_admin"("_user_id" "uuid", "_space_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_space_admin"("_user_id" "uuid", "_space_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_recipes_to_default_spaces"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_recipes_to_default_spaces"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_recipes_to_default_spaces"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_space_invitation"("invitation_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_space_invitation"("invitation_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_space_invitation"("invitation_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."repair_missing_memberships"() TO "anon";
GRANT ALL ON FUNCTION "public"."repair_missing_memberships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."repair_missing_memberships"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_foods"("search_query" "text", "space_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."search_foods"("search_query" "text", "space_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_foods"("search_query" "text", "space_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."text2ltree_wrapper"("text_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."text2ltree_wrapper"("text_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text2ltree_wrapper"("text_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_food_metadata"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_food_metadata"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_food_metadata"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_food_path_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_food_path_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_food_path_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_base_unit_ref"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_base_unit_ref"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_base_unit_ref"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_unit_conversion"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_unit_conversion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_unit_conversion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_unit_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_unit_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_unit_creation"() TO "service_role";


















GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."custom_units" TO "anon";
GRANT ALL ON TABLE "public"."custom_units" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_units" TO "service_role";



GRANT ALL ON TABLE "public"."food_categories" TO "anon";
GRANT ALL ON TABLE "public"."food_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."food_categories" TO "service_role";



GRANT ALL ON TABLE "public"."food_properties" TO "anon";
GRANT ALL ON TABLE "public"."food_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."food_properties" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."pantry_items" TO "anon";
GRANT ALL ON TABLE "public"."pantry_items" TO "authenticated";
GRANT ALL ON TABLE "public"."pantry_items" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_version_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."recipe_version_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_version_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_version_steps" TO "anon";
GRANT ALL ON TABLE "public"."recipe_version_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_version_steps" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_versions" TO "anon";
GRANT ALL ON TABLE "public"."recipe_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_versions" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."schema_migrations" TO "anon";
GRANT ALL ON TABLE "public"."schema_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_list_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."space_category_settings" TO "anon";
GRANT ALL ON TABLE "public"."space_category_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."space_category_settings" TO "service_role";



GRANT ALL ON TABLE "public"."space_invitations" TO "anon";
GRANT ALL ON TABLE "public"."space_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."space_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."spaces" TO "anon";
GRANT ALL ON TABLE "public"."spaces" TO "authenticated";
GRANT ALL ON TABLE "public"."spaces" TO "service_role";



GRANT ALL ON TABLE "public"."steps" TO "anon";
GRANT ALL ON TABLE "public"."steps" TO "authenticated";
GRANT ALL ON TABLE "public"."steps" TO "service_role";



GRANT ALL ON TABLE "public"."unit_conversions" TO "anon";
GRANT ALL ON TABLE "public"."unit_conversions" TO "authenticated";
GRANT ALL ON TABLE "public"."unit_conversions" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_spaces" TO "anon";
GRANT ALL ON TABLE "public"."user_spaces" TO "authenticated";
GRANT ALL ON TABLE "public"."user_spaces" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























