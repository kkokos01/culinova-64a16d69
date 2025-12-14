import json
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from uploader import RecipeUploader

# Load a sample recipe to test
with open('validated_recipes/chilaquiles_rojos.json', 'r') as f:
    recipe = json.load(f)

# Create uploader and test
uploader = RecipeUploader()
recipe_id = uploader.upload_recipe(recipe, "test-batch", {"status": "PASS", "reason": ""})

if recipe_id:
    print(f"✅ Recipe uploaded with ID: {recipe_id}")
else:
    print("❌ Upload failed")
