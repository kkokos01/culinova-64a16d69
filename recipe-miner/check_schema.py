import supabase

# Create Supabase client
client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

# Get table schema
try:
    # Use RPC to get table info
    result = client.rpc('get_table_schema', {'table_name': 'recipes'}).execute()
    print("Table schema:", result.data)
except Exception as e:
    print(f"Error: {e}")
    
    # Alternative: try to describe the table
    print("\nLet's check what columns exist by trying to select from information_schema:")
    # This won't work with the JS client, so let's check a working recipe instead
