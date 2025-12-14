import os
from supabase import create_client
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class DatabaseManager:
    """Shared database utilities for recipe mining pipeline"""
    
    def __init__(self, client):
        self.db = client
        self.unit_cache = {}
        self.food_cache = {}
    
    def get_or_create_unit(self, unit_name: str) -> Optional[str]:
        """Find unit ID with caching and fallback"""
        if unit_name in self.unit_cache:
            return self.unit_cache[unit_name]
        
        # Try exact match first
        res = self.db.table("units").select("id").ilike("name", unit_name).execute()
        if res.data:
            uid = res.data[0]['id']
            self.unit_cache[unit_name] = uid
            return uid
        
        # Try abbreviation match
        res = self.db.table("units").select("id").ilike("abbreviation", unit_name).execute()
        if res.data:
            uid = res.data[0]['id']
            self.unit_cache[unit_name] = uid
            return uid
        
        # Fallback to 'piece' for unknown units
        res = self.db.table("units").select("id").ilike("name", "piece").execute()
        if res.data:
            uid = res.data[0]['id']
            self.unit_cache[unit_name] = uid
            print(f"   ⚠️ Using 'piece' as fallback for unit '{unit_name}'")
            return uid
        
        print(f"   ❌ Could not find unit: {unit_name}")
        return None
    
    def get_or_create_food(self, food_name: str, space_id: str, user_id: str) -> Optional[str]:
        """Find or create food using the find_or_create_food RPC function"""
        cache_key = f"{food_name}_{space_id}"
        
        if cache_key in self.food_cache:
            return self.food_cache[cache_key]
        
        try:
            # Use the existing RPC function with fuzzy matching
            res = self.db.rpc("find_or_create_food", {
                "p_name": food_name,
                "p_space_id": space_id,
                "p_user_id": user_id,
                "p_source": "ai_miner"
            }).execute()
            
            if res.data and len(res.data) > 0:
                food_id = res.data[0]['food_id']
                self.food_cache[cache_key] = food_id
                return food_id
                
        except Exception as e:
            print(f"   ⚠️ DB Error creating food '{food_name}': {e}")
        
        return None
    
    def clear_cache(self):
        """Clear all caches - useful for testing or large batches"""
        self.unit_cache.clear()
        self.food_cache.clear()
