import json
import os
import sys
import uuid
from typing import Dict, List, Optional
from dotenv import load_dotenv
import supabase

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
TARGET_USER_ID = os.getenv('TARGET_USER_ID', '3a9d183d-24d4-4cb6-aaf0-38635aa47c26')
STAGING_SPACE_ID = os.getenv('STAGING_SPACE_ID', 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27')

# Safety check
if "aajeyifqrupykjyapoft" not in SUPABASE_URL:
    raise Exception(
        "🔒 SAFETY LOCK: Not targeting development environment!\n"
        f"Current URL: {SUPABASE_URL}\n"
        "Expected to contain: aajeyifqrupykjyapoft"
    )

# Initialize Supabase client
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

class RecipeUploader:
    """Uploads validated recipes to staging space using direct table inserts"""
    
    def __init__(self):
        self.input_dir = "validated_recipes"
    
    def upload_recipe(self, recipe_data: Dict, qa_data: Dict, batch_id: str) -> Optional[str]:
        """Upload a single recipe using the exact pattern from recipeService.ts"""
        title = recipe_data.get('title', 'Unknown Recipe')
        
        try:
            # Step 1: Create the recipe (exact pattern from recipeService.ts)
            recipe_payload = {
                "title": recipe_data['title'],
                "description": recipe_data.get('description', ''),
                "image_url": None,
                "prep_time_minutes": int(recipe_data['prep_time_minutes']),
                "cook_time_minutes": int(recipe_data['cook_time_minutes']),
                "servings": int(recipe_data['servings']),
                "difficulty": recipe_data['difficulty'],
                "is_public": False,
                "privacy_level": "space",
                "space_id": STAGING_SPACE_ID,
                "user_id": TARGET_USER_ID,
                "calories_per_serving": None,
            }
            
            # Add QA flag to description if needed
            if qa_data['status'] == 'FLAG':
                recipe_payload['description'] = f"⚠️ QA Flagged: {qa_data['reason']}\n\n{recipe_payload['description']}"
            
            result = supabase_client.table('recipes').insert(recipe_payload).execute()
            
            if not result.data or len(result.data) == 0:
                raise Exception("Failed to create recipe")
            
            recipe_id = result.data[0]['id']
            
            # Step 2: Create ingredients (exact pattern from recipeService.ts)
            if recipe_data.get('ingredients'):
                ingredients = []
                for ing in recipe_data['ingredients']:
                    ingredients.append({
                        "recipe_id": recipe_id,
                        "food_id": None,  # Using text fields instead
                        "unit_id": None,
                        "food_name": ing['item'],
                        "unit_name": ing['unit'],
                        "amount": float(ing['amount']),
                    })
                
                ing_result = supabase_client.table('ingredients').insert(ingredients).execute()
                if hasattr(ing_result, 'error') and ing_result.error:
                    # Rollback recipe if ingredients fail
                    supabase_client.table('recipes').delete().eq('id', recipe_id).execute()
                    raise Exception(f"Failed to insert ingredients: {ing_result.error}")
                
                print(f"      ✅ Inserted {len(ingredients)} ingredients")
            
            # Step 3: Create steps (using 'steps' table, not recipe_version_steps)
            if recipe_data.get('steps'):
                steps = []
                for step in recipe_data['steps']:
                    steps.append({
                        "recipe_id": recipe_id,
                        "order_number": int(step['order']),
                        "instruction": step['instruction'],
                        "duration_minutes": int(step.get('duration_minutes', 0)),
                    })
                
                steps_result = supabase_client.table('steps').insert(steps).execute()
                if hasattr(steps_result, 'error') and steps_result.error:
                    # Rollback if steps fail
                    supabase_client.table('ingredients').delete().eq('recipe_id', recipe_id).execute()
                    supabase_client.table('recipes').delete().eq('id', recipe_id).execute()
                    raise Exception(f"Failed to insert steps: {steps_result.error}")
                
                print(f"      ✅ Inserted {len(steps)} steps")
            
            return recipe_id
            
        except Exception as e:
            print(f"      ❌ Upload failed: {e}")
            return None
    
    def upload_batch(self, input_file: str) -> bool:
        """Upload all recipes in a validated batch file"""
        print(f"🚚 Uploading batch: {os.path.basename(input_file)}")
        
        # Load validated recipes
        with open(input_file, 'r') as f:
            items = json.load(f)
        
        # Generate batch ID for tracking
        batch_id = str(uuid.uuid4())
        stats = {"success": 0, "failed": 0, "skipped": 0}
        
        print(f"\n📊 Uploading {len(items)} recipes to staging space")
        print(f"   Batch ID: {batch_id}\n")
        
        # Upload each recipe
        for idx, item in enumerate(items):
            recipe = item.get('recipe')
            qa_meta = item.get('qa_meta', {})
            
            if not recipe:
                print(f"  ⚠️  Item {idx+1}: No recipe data - skipping")
                stats["skipped"] += 1
                continue
            
            # Upload recipe
            recipe_id = self.upload_recipe(recipe, qa_meta, batch_id)
            
            if recipe_id:
                print(f"  ✅ {idx+1}/{len(items)}: {recipe['title'][:50]}...")
                stats["success"] += 1
            else:
                print(f"  ❌ {idx+1}/{len(items)}: {recipe.get('title', 'Unknown')[:50]}...")
                stats["failed"] += 1
        
        # Summary
        print(f"\n📈 Upload Complete:")
        print(f"   ✅ Success: {stats['success']}")
        print(f"   ❌ Failed: {stats['failed']}")
        print(f"   ⚠️  Skipped: {stats['skipped']}")
        
        return stats["failed"] == 0

if __name__ == "__main__":
    uploader = RecipeUploader()
    
    # Find all batch files
    batch_files = [
        os.path.join(uploader.input_dir, f) 
        for f in os.listdir(uploader.input_dir) 
        if f.startswith('checked_') and f.endswith('.json')
    ]
    
    if not batch_files:
        print("❌ No validated batch files found")
        sys.exit(1)
    
    print(f"📁 Found {len(batch_files)} batch file(s)")
    
    # Upload each batch
    all_success = True
    for batch_file in batch_files:
        success = uploader.upload_batch(batch_file)
        if not success:
            all_success = False
    
    if all_success:
        print("\n🎉 All batches uploaded successfully!")
    else:
        print("\n⚠️  Some uploads failed. Check logs above.")
        sys.exit(1)
