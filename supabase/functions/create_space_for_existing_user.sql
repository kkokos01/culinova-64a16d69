
CREATE OR REPLACE FUNCTION public.create_space_for_existing_user(user_id_param uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    is_active,
    is_default
  ) 
  VALUES (
    'My Recipes', 
    user_id_param, 
    100, 
    5, 
    true,
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
$function$;
