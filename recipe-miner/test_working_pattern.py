import json
import sys
import os
import uuid
import supabase
from typing import Dict, List, Optional

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Create Supabase client
client = supabase.create_client(
    'https://aajeyifqrupykjyapoft.supabase.co',
    'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

# Load the batch file
with open('validated_recipes/checked_20251214_102900_batch_1765726099.json', 'r') as f:
    batch = json.load(f)

# Get the first recipe
if len(batch) > 0:
    item = batch[0]
    recipe = item['recipe']
    
    print(f"Testing upload of: {recipe['title']}")
    
    # Create recipe using the exact same pattern as recipeService.ts
    try:
        # Step 1: Create the recipe
        recipe_payload = {
            "title": recipe['title'],
            "description": recipe.get('description', ''),
            "image_url": None,
            "prep_time_minutes": int(recipe['prep_time_minutes']),
            "cook_time_minutes": int(recipe['cook_time_minutes']),
            "servings": int(recipe['servings']),
            "difficulty": recipe['difficulty'],
            "is_public": False,
            "privacy_level": "space",
            "space_id": "e5d604e7-36eb-4ce2-b40b-4ab491d80c27",
            "user_id": "3a9d183d-24d4-4cb6-aaf0-38635aa47c26",
            "calories_per_serving": None,
        }
        
        result = client.table('recipes').insert(recipe_payload).execute()
        recipe_id = result.data[0]['id']
        print(f"✅ Recipe created: {recipe_id}")
        
        # Step 2: Create ingredients (exact pattern from recipeService.ts)
        ingredients = []
        for idx, ing in enumerate(recipe['ingredients']):
            ingredients.append({
                "recipe_id": recipe_id,
                "food_id": None,  # Using text fields instead
                "unit_id": None,
                "food_name": ing['item'],
                "unit_name": ing['unit'],
                "amount": float(ing['amount']),
            })
        
        ing_result = client.table('ingredients').insert(ingredients).execute()
        print(f"✅ Inserted {len(ingredients)} ingredients")
        
        # Step 3: Create steps (using 'steps' table, not recipe_version_steps)
        steps = []
        for step in recipe['steps']:
            steps.append({
                "recipe_id": recipe_id,
                "order_number": int(step['order']),
                "instruction": step['instruction'],
                "duration_minutes": int(step.get('duration_minutes', 0)),
            })
        
        steps_result = client.table('steps').insert(steps).execute()
        print(f"✅ Inserted {len(steps)} steps")
        
        # Verify the ingredients were saved correctly
        verify = client.table('ingredients').select('*').eq('recipe_id', recipe_id).execute()
        print("\nSample ingredients:")
        for ing in verify.data[:3]:
            print(f"  - {ing['food_name']} {ing['amount']} {ing['unit_name']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
