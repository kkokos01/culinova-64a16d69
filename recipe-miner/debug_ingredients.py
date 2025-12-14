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
    
    # Test ingredient preparation
    from uploader import RecipeUploader
    uploader = RecipeUploader()
    
    ingredients = uploader.prepare_ingredients(
        recipe.get('ingredients', []),
        'e5d604e7-36eb-4ce2-b40b-4ab491d80c27',
        '3a9d183d-24d4-4cb6-aaf0-38635aa47c26'
    )
    
    print("Prepared ingredients structure:")
    print(json.dumps(ingredients[0], indent=2))
    print(f"\nTotal ingredients: {len(ingredients)}")
