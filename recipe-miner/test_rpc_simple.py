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

# Test the RPC function with simple data
try:
    result = client.rpc("create_recipe_with_ingredients", {
        "recipe_data": {
            "title": "Test Recipe",
            "description": "Test",
            "prep_time_minutes": 10,
            "cook_time_minutes": 20,
            "servings": 4,
            "difficulty": "easy",
            "user_id": "3a9d183d-24d4-4cb6-aaf0-38635aa47c26",
            "space_id": "e5d604e7-36eb-4ce2-b40b-4ab491d80c27",
            "is_public": False,
            "privacy_level": "space",
            "tags": ["#test"],
            "batch_id": "test",
            "qa_status": "pass"
        },
        "ingredients_data": [{
            "food_name": "Test Food",
            "unit_name": "cup",
            "amount": 1.0,
            "order_index": 1
        }],
        "steps_data": [{
            "instruction": "Test step",
            "order_index": 1
        }]
    }).execute()
    
    print("✅ RPC function works! Recipe ID:", result.data)
    
except Exception as e:
    print(f"❌ RPC failed: {e}")
    print(f"Error type: {type(e)}")
