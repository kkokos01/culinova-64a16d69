import supabase

# Create Supabase client
client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

# Get an existing recipe to see its structure
try:
    result = client.table('recipes').select('*').limit(1).execute()
    if result.data:
        print("Recipe columns:", list(result.data[0].keys()))
        print("\nSample recipe data:")
        for key, value in result.data[0].items():
            print(f"  {key}: {value}")
    else:
        print("No recipes found")
except Exception as e:
    print(f"Error: {e}")
