-- Test if the invite_user_to_space function exists and check its signature
SELECT 
    proname as function_name,
    proargtypes as arg_type_oids,
    pg_get_function_arguments(oid) as argument_list,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'invite_user_to_space';
