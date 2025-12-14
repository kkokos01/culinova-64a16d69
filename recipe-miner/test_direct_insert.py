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

# Test direct table insert like the main app does
try:
    # First create the recipe
    recipe_data = {
        "title": "Test Recipe Direct",
        "description": "Test description",
        "prep_time_minutes": 10,
        "cook_time_minutes": 20,
        "servings": 4,
        "difficulty": "easy",
        "user_id": "3a9d183d-24d4-4cb6-aaf0-38635aa47c26",
        "space_id": "e5d604e7-36eb-4ce2-b40b-4ab491d80c27",
        "is_public": False,
        "privacy_level": "space"
    }
    
    result = client.table('recipes').insert(recipe_data).execute()
    recipe_id = result.data[0]['id']
    print(f"✅ Recipe created with ID: {recipe_id}")
    
    # Now insert ingredients with text fields
    ingredients = [{
        "recipe_id": recipe_id,
        "food_name": "Test Food",
        "unit_name": "cup",
        "amount": 1.0,
        "order_index": 1
    }]
    
    result = client.table('ingredients').insert(ingredients).execute()
    print(f"✅ {len(result.data)} ingredients inserted")
    
    # Verify the ingredients
    result = client.table('ingredients').select('*').eq('recipe_id', recipe_id).execute()
    print("\nIngredients saved:")
    for ing in result.data:
        print(f"  - {ing['food_name']} {ing['amount']} {ing['unit_name']}")
    
except Exception as e:
    print(f"❌ Failed: {e}")
