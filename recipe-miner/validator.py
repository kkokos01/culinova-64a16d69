import json
import os
import glob
import time
from typing import Dict, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Initialize Gemini with Flash for faster, cheaper validation
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# --- DATA MODELS ---
class ValidationResult(BaseModel):
    status: Literal["PASS", "FLAG"] = Field(description="Validation status")
    reason: str = Field(description="Explanation for the status. Use 'OK' for PASS status")

class RecipeValidator:
    """Validates recipes using LLM-as-a-Judge approach"""
    
    def __init__(self):
        self.input_dir = "draft_recipes"
        self.output_dir = "validated_recipes"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def validate_recipe(self, recipe: Dict) -> ValidationResult:
        """Validate a single recipe using AI"""
        title = recipe.get('title', 'Unknown Recipe')
        
        # Quick sanity checks before AI validation
        quick_checks = self._quick_checks(recipe)
        if quick_checks:
            return ValidationResult(
                status="FLAG",
                reason=quick_checks
            )
        
        # Prepare validation prompt
        prompt = f"""
        You are a Food Safety & Quality Assurance Officer. Review this recipe for critical issues.
        
        RECIPE TO VALIDATE:
        Title: {title}
        Description: {recipe.get('description', 'No description')}
        Prep Time: {recipe.get('prep_time_minutes', 0)} minutes
        Cook Time: {recipe.get('cook_time_minutes', 0)} minutes
        Servings: {recipe.get('servings', 0)}
        Difficulty: {recipe.get('difficulty', 'unknown')}
        
        INGREDIENTS ({len(recipe.get('ingredients', []))}):
        {json.dumps(recipe.get('ingredients', []), indent=2)}
        
        STEPS ({len(recipe.get('steps', []))}):
        {json.dumps(recipe.get('steps', []), indent=2)}
        
        VALIDATION CRITERIA:
        1. SAFETY: Any dangerous or non-food items? Any unsafe cooking practices?
        2. LOGIC: Do steps reference ingredients that aren't listed? Are steps in logical order?
        3. COMPLETENESS: Are all necessary steps included? Are cooking times realistic?
        4. CONSISTENCY: Do ingredient quantities match the number of servings?
        5. AUTHENTICITY: For traditional dishes, are there any clearly inauthentic ingredients?
        
        RESPOND WITH JSON ONLY:
        {{
            "status": "PASS" or "FLAG",
            "reason": "Brief explanation. Use 'OK' if status is PASS"
        }}
        """
        
        try:
            result = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.3  # Lower temperature for consistent validation
                }
            )
            
            data = json.loads(result.text)
            validation = ValidationResult(**data)
            
            # Additional post-validation checks
            if validation.status == "PASS":
                post_check = self._post_validation_checks(recipe)
                if post_check:
                    validation.status = "FLAG"
                    validation.reason = post_check
            
            return validation
            
        except Exception as e:
            return ValidationResult(
                status="FLAG",
                reason=f"Validation error: {str(e)}"
            )
    
    def _quick_checks(self, recipe: Dict) -> str:
        """Fast checks before AI validation"""
        # Check required fields
        required_fields = ['title', 'description', 'ingredients', 'steps']
        for field in required_fields:
            if not recipe.get(field):
                return f"Missing required field: {field}"
        
        # Check minimum requirements
        if len(recipe.get('ingredients', [])) < 2:
            return "Recipe has too few ingredients (minimum 2 required)"
        
        if len(recipe.get('steps', [])) < 2:
            return "Recipe has too few steps (minimum 2 required)"
        
        # Check for reasonable times
        prep_time = recipe.get('prep_time_minutes', 0)
        cook_time = recipe.get('cook_time_minutes', 0)
        
        if prep_time < 0 or cook_time < 0:
            return "Negative time values are not allowed"
        
        if prep_time + cook_time > 480:  # 8 hours max
            return "Total cooking time exceeds 8 hours"
        
        # Check servings
        servings = recipe.get('servings', 0)
        if servings < 1 or servings > 50:
            return "Number of servings must be between 1 and 50"
        
        return None  # All quick checks passed
    
    def _post_validation_checks(self, recipe: Dict) -> str:
        """Additional checks after AI validation"""
        # Check for duplicate ingredients
        ingredients = recipe.get('ingredients', [])
        ingredient_names = [ing.get('item', '').lower() for ing in ingredients]
        duplicates = [name for name in ingredient_names if ingredient_names.count(name) > 1]
        
        if duplicates:
            return f"Duplicate ingredients: {', '.join(set(duplicates))}"
        
        # Check for step order consistency
        steps = recipe.get('steps', [])
        step_orders = [step.get('order', 0) for step in steps]
        if step_orders != sorted(step_orders):
            return "Steps are not in sequential order"
        
        return None  # All post checks passed
    
    def validate_batch(self, input_file: str) -> str:
        """Validate all recipes in a batch file"""
        print(f"🕵️‍♂️ Validating batch: {os.path.basename(input_file)}")
        
        # Load recipes
        with open(input_file, 'r') as f:
            recipes = json.load(f)
        
        validated_output = []
        stats = {"PASS": 0, "FLAG": 0, "ERROR": 0}
        
        print(f"   📊 Found {len(recipes)} recipes to validate\n")
        
        for idx, recipe in enumerate(recipes, 1):
            title = recipe.get('title', 'Unknown')
            print(f"   [{idx}/{len(recipes)}] Validating: {title}")
            
            try:
                validation = self.validate_recipe(recipe)
                stats[validation.status] += 1
                
                # Combine recipe with validation metadata
                validated_output.append({
                    "recipe": recipe,
                    "qa_meta": {
                        "status": validation.status,
                        "reason": validation.reason,
                        "validated_at": datetime.now().isoformat()
                    }
                })
                
                status_icon = "✅" if validation.status == "PASS" else "⚠️"
                print(f"      {status_icon} {validation.status}: {validation.reason}")
                
            except Exception as e:
                stats["ERROR"] += 1
                print(f"      ❌ Error: {e}")
                validated_output.append({
                    "recipe": recipe,
                    "qa_meta": {
                        "status": "FLAG",
                        "reason": f"Validation system error: {str(e)}",
                        "validated_at": datetime.now().isoformat()
                    }
                })
            
            # Rate limiting for API
            if idx < len(recipes):
                time.sleep(0.5)
        
        # Save validated batch
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"{self.output_dir}/checked_{timestamp}_{os.path.basename(input_file)}"
        
        with open(output_filename, 'w') as f:
            json.dump(validated_output, f, indent=2)
        
        # Print summary
        print(f"\n📊 Validation Summary:")
        print(f"   ✅ Passed: {stats['PASS']}")
        print(f"   ⚠️  Flagged: {stats['FLAG']}")
        print(f"   ❌ Errors: {stats['ERROR']}")
        print(f"   💾 Saved to: {output_filename}")
        
        return output_filename
    
    def validate_latest(self):
        """Validate the most recent batch file"""
        # Find the most recent draft file
        files = sorted(glob.glob(f"{self.input_dir}/batch_*.json"))
        
        if not files:
            print("❌ No draft files found. Run miner_v4.py first.")
            return None
        
        latest_file = files[-1]
        print(f"📁 Found latest batch: {os.path.basename(latest_file)}")
        
        return self.validate_batch(latest_file)

def main():
    """Main execution function"""
    validator = RecipeValidator()
    
    # Validate the latest batch
    output_file = validator.validate_latest()
    
    if output_file:
        print(f"\n🎉 Validation complete!")
        print(f"   Ready for upload to staging")
        print(f"   Run: python uploader.py")

if __name__ == "__main__":
    main()
