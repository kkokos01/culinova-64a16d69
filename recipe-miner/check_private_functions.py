import supabase

# Use service role to check if private functions exist
service_client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

print("Checking if private.is_space_admin function exists in dev...")

# Test the function directly
try:
    # Check if user is admin of Kitchen Stage
    result = service_client.rpc('is_space_admin', {
        '_user_id': '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
        '_space_id': 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27'
    }).execute()
    
    print(f"Function result: {result.data}")
    
except Exception as e:
    print(f"Error calling function: {e}")
    
    # Try checking information_schema for the function
    print("\nChecking if function exists in database...")
    try:
        # This won't work with Python client, but let's at least check if we can call it as public
        result = service_client.rpc('public.is_space_admin', {
            '_user_id': '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
            '_space_id': 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27'
        }).execute()
        print(f"Public function result: {result.data}")
    except Exception as e2:
        print(f"Public function also failed: {e2}")
