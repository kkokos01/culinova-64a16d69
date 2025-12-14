import os
import json
import time
from typing import List, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from ddgs import DDGS
import trafilatura
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# --- DATA MODELS ---
class IngredientInput(BaseModel):
    item: str = Field(description="Name of the food item")
    amount: float = Field(description="Numeric quantity")
    unit: str = Field(description="Unit name (e.g., 'cup', 'lb', 'piece')")
    category: Literal['Produce', 'Meat', 'Dairy', 'Pantry', 'Spice', 'Other'] = Field(
        description="Food category for classification"
    )

class StepInput(BaseModel):
    order: int = Field(description="Step number")
    instruction: str = Field(description="Clear instruction for this step")
    duration_minutes: int = Field(description="Estimated time for this step in minutes")

class RecipeSchema(BaseModel):
    title: str = Field(description="Recipe title")
    description: str = Field(description="Brief description of the recipe")
    prep_time_minutes: int = Field(description="Preparation time in minutes")
    cook_time_minutes: int = Field(description="Cooking time in minutes")
    servings: int = Field(description="Number of servings")
    difficulty: Literal['easy', 'medium', 'hard'] = Field(description="Difficulty level")
    ingredients: List[IngredientInput] = Field(description="List of ingredients")
    steps: List[StepInput] = Field(description="Step-by-step instructions")

class RecipeMiner:
    """Generates recipes using AI consensus from multiple sources"""
    
    def __init__(self):
        self.searcher = DDGS()
        self.output_dir = "draft_recipes"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def scrape_content(self, url: str) -> str:
        """Extract main content from a URL"""
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                content = trafilatura.extract(downloaded)
                if content:
                    return content[:10000]  # Limit to prevent token overflow
        except Exception as e:
            print(f"   ⚠️ Failed to scrape {url}: {e}")
        return None
    
    def generate_recipe(self, dish_name: str, persona: str, sources: List[str]) -> RecipeSchema:
        """Generate a consensus recipe from multiple sources"""
        print(f"   🧠 Synthesizing consensus for '{dish_name}'...")
        
        prompt = f"""
        You are a Culinary Data Architect with the following persona: {persona}
        
        TASK: Create a 'Consensus Recipe' based on the {len(sources)} source texts provided.
        
        REQUIREMENTS:
        1. Find the intersection of ingredients and techniques across sources
        2. Write UNIQUE instructions - do not copy-paste from sources
        3. Ensure all ingredients in the list are used in the steps
        4. Times should be realistic for home cooking
        5. Difficulty should reflect actual complexity
        
        SOURCES:
        {json.dumps(sources, indent=2)}
        
        OUTPUT: Valid JSON that strictly matches this schema:
        {json.dumps(RecipeSchema.model_json_schema(), indent=2)}
        """
        
        try:
            result = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.7  # Slight creativity while maintaining consistency
                }
            )
            
            data = json.loads(result.text)
            recipe = RecipeSchema(**data)  # Validate with Pydantic
            return recipe
            
        except Exception as e:
            print(f"   ❌ Generation failed: {e}")
            raise
    
    def mine_recipes(self, dish_list: List[str], persona: str = "Abuela Sofia. Authentic Mexican. Warm tone.") -> str:
        """Mine recipes for a list of dishes and save to JSON file"""
        generated_recipes = []
        total_dishes = len(dish_list)
        
        print(f"\n🍳 Starting recipe mining for {total_dishes} dishes...")
        print(f"📝 Using persona: {persona}\n")
        
        for idx, dish in enumerate(dish_list, 1):
            print(f"[{idx}/{total_dishes}] Processing: {dish}")
            
            # 1. Search for recipes
            print("   🔍 Searching for authentic recipes...")
            try:
                results = list(self.searcher.text(
                    f"authentic {dish} recipe -site:youtube.com -site:pinterest.com", 
                    max_results=3
                ))
                
                if not results:
                    print(f"   ⚠️ No search results for {dish}")
                    continue
                    
            except Exception as e:
                print(f"   ❌ Search failed for {dish}: {e}")
                continue
            
            # 2. Scrape content
            print("   📄 Scraping recipe content...")
            sources = []
            for result in results:
                content = self.scrape_content(result['href'])
                if content:
                    sources.append(content)
                time.sleep(1)  # Be respectful to servers
            
            if not sources:
                print(f"   ⚠️ No content scraped for {dish}")
                continue
            
            # 3. Generate consensus recipe
            try:
                recipe = self.generate_recipe(dish, persona, sources)
                generated_recipes.append(recipe.model_dump())
                print(f"   ✅ Generated: {recipe.title}")
                
            except Exception as e:
                print(f"   ❌ Failed to generate recipe for {dish}: {e}")
                continue
            
            # Rate limiting
            if idx < total_dishes:
                print("   ⏳ Waiting 2 seconds before next recipe...")
                time.sleep(2)
        
        # 4. Save batch to file
        if generated_recipes:
            timestamp = int(time.time())
            filename = f"{self.output_dir}/batch_{timestamp}.json"
            
            with open(filename, 'w') as f:
                json.dump(generated_recipes, f, indent=2)
            
            print(f"\n✅ Mining complete!")
            print(f"📦 Generated {len(generated_recipes)} recipes")
            print(f"💾 Saved to: {filename}")
            
            return filename
        else:
            print("\n❌ No recipes were generated")
            return None

def main():
    """Main execution function"""
    # Define your niche menu here
    # Start with a small test batch
    dishes = [
        "Chilaquiles Rojos",
        "Sopa de Fideo",
        "Elote Esquites",
        "Pozole Rojo"
    ]
    
    # Define persona based on your niche
    personas = {
        "cocina": "Abuela Sofia. Authentic Mexican. Warm, traditional tone.",
        "commune": "The Diplomat. Efficient, budget-conscious, clear instructions."
    }
    
    # Create miner and run
    miner = RecipeMiner()
    
    # You can specify which persona to use
    selected_persona = personas.get("cocina", personas["cocina"])
    
    # Mine recipes
    output_file = miner.mine_recipes(dishes, selected_persona)
    
    if output_file:
        print(f"\n🎉 Ready for validation!")
        print(f"   Run: python validator.py")

if __name__ == "__main__":
    main()
