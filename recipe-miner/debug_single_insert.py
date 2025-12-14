import json
import sys
import os
import supabase

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Create Supabase client
client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

# Test inserting ingredients one by one
try:
    # Create a test recipe first
    recipe = client.table('recipes').insert({
        "title": "Test Recipe Debug",
        "user_id": "3a9d183d-24d4-4cb6-aaf0-38635aa47c26",
        "space_id": "e5d604e7-36eb-4ce2-b40b-4ab491d80c27",
        "is_public": False,
        "privacy_level": "space"
    }).execute()
    
    recipe_id = recipe.data[0]['id']
    print(f"Created recipe: {recipe_id}")
    
    # Test single ingredient insert
    ingredient = {
        "recipe_id": recipe_id,
        "food_name": "Test Food",
        "unit_name": "cup",
        "amount": 1.0,
        "order_index": 1
    }
    
    print("Inserting single ingredient...")
    result = client.table('ingredients').insert(ingredient).execute()
    print(f"✅ Success: {result.data}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
