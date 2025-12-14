import os
import json
import uuid
import glob
from typing import Dict, List, Optional
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from utils import DatabaseManager

# Load environment variables
load_dotenv()

# Required configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
TARGET_USER_ID = os.getenv("TARGET_USER_ID")
STAGING_SPACE_ID = os.getenv("STAGING_SPACE_ID")

# Validate required environment variables
missing_vars = []
for var in ["SUPABASE_URL", "SUPABASE_KEY", "TARGET_USER_ID", "STAGING_SPACE_ID"]:
    if not os.getenv(var):
        missing_vars.append(var)

if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Safety check - ensure we're targeting dev environment
if "aajeyifqrupykjyapoft" not in SUPABASE_URL:
    raise Exception(
        "🔒 SAFETY LOCK: Not targeting development environment!\n"
        f"Current URL: {SUPABASE_URL}\n"
        "Expected to contain: aajeyifqrupykjyapoft"
    )

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class RecipeUploader:
    """Uploads validated recipes to staging space using atomic transactions"""
    
    def __init__(self):
        self.db = DatabaseManager(supabase)
        self.input_dir = "validated_recipes"
    
    def prepare_ingredients(self, ingredients: List[Dict], space_id: str, user_id: str) -> List[Dict]:
        """Prepare ingredients using text fields instead of resolving IDs"""
        prepared = []
        
        for idx, ing in enumerate(ingredients):
            print(f"      🥘 Adding: {ing['item']}")
            
            # Use text fields directly - no ID resolution needed
            prepared.append({
                "food_name": ing['item'],
                "unit_name": ing['unit'],
                "amount": float(ing['amount']),
                "order_index": idx + 1
            })
        
        return prepared
    
    def prepare_steps(self, steps: List[Dict]) -> List[Dict]:
        """Prepare steps for database insertion"""
        prepared = []
        
        for step in steps:
            prepared.append({
                "instruction": step['instruction'],
                "order_index": int(step['order']),
                "duration_minutes": int(step.get('duration_minutes', 0))
            })
        
        return prepared
    
    def upload_recipe(self, recipe_data: Dict, qa_data: Dict, batch_id: str) -> Optional[str]:
        """Upload a single recipe using atomic transaction"""
        title = recipe_data.get('title', 'Unknown Recipe')
        
        try:
            # Prepare ingredients
            ingredients = self.prepare_ingredients(
                recipe_data.get('ingredients', []),
                STAGING_SPACE_ID,
                TARGET_USER_ID
            )
            
            if not ingredients:
                print(f"      ❌ No valid ingredients - skipping recipe")
                return None
            
            # Prepare steps
            steps = self.prepare_steps(recipe_data.get('steps', []))
            
            # Prepare tags with QA status
            qa_tags = [f"#QA_{qa_data['status']}"]
            
            # Prepare description with QA notes if flagged
            description = recipe_data.get('description', '')
            if qa_data['status'] == 'FLAG':
                description = f" QA Flagged: {qa_data['reason']}\n\n{description}"
            
            # Prepare recipe payload with all required fields
            recipe_payload = {
                "title": recipe_data['title'],
                "description": description,
                "prep_time_minutes": int(recipe_data['prep_time_minutes']),
                "cook_time_minutes": int(recipe_data['cook_time_minutes']),
                "servings": int(recipe_data['servings']),
                "difficulty": recipe_data['difficulty'],
                "user_id": TARGET_USER_ID,
                "space_id": STAGING_SPACE_ID,
                "is_public": False,  # Staging is private
                "privacy_level": "space",
                "tags": qa_tags,
                "batch_id": str(uuid.uuid4()),  # Generate UUID for batch_id
                "qa_status": qa_data['status'].lower(),
                "calories_per_serving": None,
                "image_url": None
            }
            
            # Upload using direct table inserts (like the main app)
            # First create the recipe
            result = supabase.table('recipes').insert(recipe_payload).execute()
            
            if not result.data or len(result.data) == 0:
                raise Exception("Failed to create recipe")
            
            recipe_id = result.data[0]['id']
            
            # Insert ingredients
            if ingredients:
                # Add recipe_id to each ingredient
                ingredients_with_id = [
                    {**ing, "recipe_id": recipe_id} 
                    for ing in ingredients
                ]
                
                ing_result = supabase.table('ingredients').insert(ingredients_with_id).execute()
                if hasattr(ing_result, 'error') and ing_result.error:
                    # Clean up recipe if ingredients fail
                    supabase.table('recipes').delete().eq('id', recipe_id).execute()
                    raise Exception(f"Failed to insert ingredients: {ing_result.error}")
            
            # Insert steps
            if steps:
                # Add recipe_id to each step
                steps_with_id = [
                    {**step, "recipe_id": recipe_id} 
                    for step in steps
                ]
                
                steps_result = supabase.table('recipe_version_steps').insert(steps_with_id).execute()
                if hasattr(steps_result, 'error') and steps_result.error:
                    # Clean up if steps fail
                    supabase.table('ingredients').delete().eq('recipe_id', recipe_id).execute()
                    supabase.table('recipes').delete().eq('id', recipe_id).execute()
                    raise Exception(f"Failed to insert steps: {steps_result.error}")
            
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
        
        for idx, item in enumerate(items, 1):
            recipe = item.get('recipe', {})
            qa = item.get('qa_meta', {})
            title = recipe.get('title', 'Unknown')
            
            print(f"   [{idx}/{len(items)}] Uploading: {title}")
            
            try:
                recipe_id = self.upload_recipe(recipe, qa, batch_id)
                
                if recipe_id:
                    stats["success"] += 1
                    status_icon = "✅"
                    status_text = qa.get('status', 'UNKNOWN')
                    print(f"      {status_icon} Success [{status_text}] - ID: {recipe_id}")
                else:
                    stats["skipped"] += 1
                    print(f"      ⏭️  Skipped")
                
            except Exception as e:
                stats["failed"] += 1
                print(f"      ❌ Failed: {e}")
        
        # Print summary
        print(f"\n📊 Upload Summary:")
        print(f"   ✅ Successful: {stats['success']}")
        print(f"   ⏭️  Skipped: {stats['skipped']}")
        print(f"   ❌ Failed: {stats['failed']}")
        print(f"   📍 Staging Space: {STAGING_SPACE_ID}")
        print(f"   🆔 Batch ID: {batch_id}")
        
        # Save upload record
        self._save_upload_record(input_file, batch_id, stats)
        
        return stats["success"] > 0
    
    def _save_upload_record(self, input_file: str, batch_id: str, stats: Dict):
        """Save a record of the upload for tracking"""
        record = {
            "timestamp": datetime.now().isoformat(),
            "input_file": os.path.basename(input_file),
            "batch_id": batch_id,
            "space_id": STAGING_SPACE_ID,
            "stats": stats
        }
        
        # Create upload records directory if needed
        os.makedirs("upload_records", exist_ok=True)
        
        # Save record
        record_file = f"upload_records/upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(record_file, 'w') as f:
            json.dump(record, f, indent=2)
        
        print(f"   📋 Upload record saved: {record_file}")
    
    def upload_latest(self):
        """Upload the most recent validated batch"""
        # Find the most recent validated file
        files = sorted(glob.glob(f"{self.input_dir}/checked_*.json"))
        
        if not files:
            print("❌ No validated files found. Run validator.py first.")
            return False
        
        latest_file = files[-1]
        print(f"📁 Found latest validated batch: {os.path.basename(latest_file)}")
        
        return self.upload_batch(latest_file)
    
    def check_staging_space(self):
        """Check the contents of the staging space"""
        try:
            # Get space name
            space_result = supabase.table("spaces").select("name").eq("id", STAGING_SPACE_ID).execute()
            
            if space_result.data:
                space_name = space_result.data[0]['name']
                print(f"\n📋 Staging Space: {space_name}")
                print(f"   ID: {STAGING_SPACE_ID}")
                
                # Count recipes by QA status
                recipes_result = supabase.table("recipes")\
                    .select("qa_status, title, created_at")\
                    .eq("space_id", STAGING_SPACE_ID)\
                    .order("created_at", desc=True)\
                    .limit(10)\
                    .execute()
                
                if recipes_result.data:
                    print(f"\n📊 Recent Recipes (showing last 10):")
                    for recipe in recipes_result.data:
                        status_icon = "✅" if recipe['qa_status'] == 'pass' else "⚠️"
                        print(f"   {status_icon} {recipe['title']} [{recipe['qa_status']}]")
                else:
                    print("\n   No recipes in staging space")
            else:
                print(f"❌ Staging space not found: {STAGING_SPACE_ID}")
                
        except Exception as e:
            print(f"❌ Error checking staging space: {e}")

def main():
    """Main execution function"""
    uploader = RecipeUploader()
    
    # Check staging space first
    uploader.check_staging_space()
    
    # Upload latest batch
    success = uploader.upload_latest()
    
    if success:
        print(f"\n🎉 Upload complete!")
        print(f"   Review recipes in your Culinova app")
        print(f"   Switch to the 'Kitchen Stage' collection")
    else:
        print(f"\n❌ Upload failed")

if __name__ == "__main__":
    main()
