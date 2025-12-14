import json
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load the batch file
with open('validated_recipes/checked_20251214_102900_batch_1765726099.json', 'r') as f:
    batch = json.load(f)

# Get the first recipe
if len(batch) > 0:
    item = batch[0]
    recipe = item['recipe']
    
    # Save it as a single file for testing
    with open('test_recipe.json', 'w') as f:
        json.dump(recipe, f, indent=2)
    
    print(f"Extracted recipe: {recipe['title']}")
    print(f"Ingredients count: {len(recipe.get('ingredients', []))}")
    
    # Test upload
    from uploader import RecipeUploader
    uploader = RecipeUploader()
    recipe_id = uploader.upload_recipe(recipe, item['qa_meta'], "test-batch")
    
    if recipe_id:
        print(f"✅ Recipe uploaded with ID: {recipe_id}")
        
        # Check the ingredients were saved correctly
        import supabase
        client = supabase.create_client(
            'https://aajeyifqrupykjyapoft.supabase.co',
            'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
        )
        
        result = client.table('ingredients').select('*').eq('recipe_id', recipe_id).execute()
        print(f"\nIngredients saved: {len(result.data)}")
        for ing in result.data[:3]:  # Show first 3
            print(f"  - {ing['food_name']} {ing['amount']} {ing['unit_name']}")
    else:
        print("❌ Upload failed")
