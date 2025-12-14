import supabase

# Create Supabase client
client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

# Check the spaces table structure
try:
    # Get a space to see its columns
    result = client.table('spaces').select('*').limit(1).execute()
    if result.data:
        print("Spaces table columns:", list(result.data[0].keys()))
        
        # Check if is_active column exists
        has_is_active = 'is_active' in result.data[0]
        print(f"\nHas 'is_active' column: {has_is_active}")
        
        # Try querying without is_active filter
        print("\nQuerying spaces without is_active filter:")
        all_spaces = client.table('spaces').select('*').execute()
        print(f"Found {len(all_spaces.data)} spaces total")
        
        # Check Kitchen Stage specifically
        kitchen = client.table('spaces').select('*').eq('id', 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27').execute()
        if kitchen.data:
            print(f"\nKitchen Stage details:")
            for key, value in kitchen.data[0].items():
                print(f"  {key}: {value}")
    
except Exception as e:
    print(f"❌ Error: {e}")
