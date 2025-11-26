import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

/**
 * Simple food and unit mapper for AI integration
 * Creates new entries when exact matches aren't found
 */
export class FoodUnitMapper {
  
  /**
   * Find or create a food item in the database - simplified to return text
   */
  async findOrCreateFood(foodName: string, spaceId: string): Promise<{food_id?: string, food_name: string}> {
    try {
      // For MVP, just return the food name as text
      // Skip database lookup entirely to avoid RLS issues
      return {
        food_name: foodName.toLowerCase()
      };
    } catch (error) {
      console.error('Error in findOrCreateFood:', error);
      // Always return food name as fallback
      return {
        food_name: foodName.toLowerCase()
      };
    }
  }
  
  /**
   * Find or create a unit in the database - simplified to return text
   */
  async findOrCreateUnit(unitName: string): Promise<{unit_id?: string, unit_name: string}> {
    try {
      // For MVP, just return the unit name as text
      // Skip database lookup entirely to avoid RLS issues
      return {
        unit_name: unitName.toLowerCase().trim()
      };
    } catch (error) {
      console.error('Error in findOrCreateUnit:', error);
      // Always return unit name as fallback
      return {
        unit_name: unitName.toLowerCase().trim()
      };
    }
  }
}

// Export singleton instance
export const foodUnitMapper = new FoodUnitMapper();
