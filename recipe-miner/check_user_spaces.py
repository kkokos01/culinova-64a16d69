import supabase

# Create Supabase client
client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

# Check user_spaces for the test user
try:
    # Get all spaces for the user
    result = client.table('user_spaces').select('*').eq('user_id', '3a9d183d-24d4-4cb6-aaf0-38635aa47c26').execute()
    
    print(f"Found {len(result.data)} space memberships for user:")
    for space in result.data:
        print(f"  - Space ID: {space['space_id']}")
        print(f"    Role: {space['role']}")
        print(f"    Active: {space.get('is_active', 'N/A')}")
        print(f"    Joined: {space['created_at']}")
    
    # Also check the spaces table to see if Kitchen Stage exists
    print("\nChecking Kitchen Stage space:")
    space_result = client.table('spaces').select('*').eq('id', 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27').execute()
    if space_result.data:
        space = space_result.data[0]
        print(f"  - Name: {space['name']}")
        print(f"  - Type: {space['type']}")
        print(f"  - Status: {space.get('status', 'N/A')}")
    else:
        print("  Kitchen Stage space not found!")
        
except Exception as e:
    print(f"❌ Error: {e}")
