import { supabase } from '@/integrations/supabase/client';
import { PantryItem, PantryItemCreate, PantryItemUpdate, StorageType } from '@/types';

/**
 * Service for managing pantry items
 * Handles space-aware pantry operations (space-specific when in space, user-specific otherwise)
 */
export class PantryService {
  /**
   * Get pantry items for a user, optionally filtered by space
   */
  async getPantryItems(userId: string, spaceId?: string): Promise<PantryItem[]> {
    try {
      let query = supabase
        .from('pantry_items' as any)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      // If spaceId is provided, get items for that space
      // Otherwise, get items with no space_id (user-specific items)
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      } else {
        query = query.is('space_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pantry items:', error);
        throw error;
      }

      return (data || []) as unknown as PantryItem[];
    } catch (error) {
      console.error('Failed to get pantry items:', error);
      throw error;
    }
  }

  /**
   * Get pantry items grouped by storage type
   */
  async getPantryItemsByStorageType(userId: string, spaceId?: string): Promise<Record<StorageType, PantryItem[]>> {
    const items = await this.getPantryItems(userId, spaceId);
    
    const grouped: Record<StorageType, PantryItem[]> = {
      pantry: [],
      fridge: [],
      freezer: [],
      produce: [],
      spice: []
    };

    items.forEach(item => {
      grouped[item.storage_type].push(item);
    });

    return grouped;
  }

  /**
   * Add a single pantry item
   */
  async addPantryItem(userId: string, item: PantryItemCreate, spaceId?: string): Promise<PantryItem> {
    try {
      const { data, error } = await supabase
        .from('pantry_items' as any)
        .insert({
          user_id: userId,
          space_id: spaceId || null,
          name: item.name.trim(),
          quantity: item.quantity?.trim() || null,
          storage_type: item.storage_type,
          is_staple: item.is_staple || false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding pantry item:', error);
        throw error;
      }

      return data as unknown as PantryItem;
    } catch (error) {
      console.error('Failed to add pantry item:', error);
      throw error;
    }
  }

  /**
   * Add multiple pantry items (batch operation)
   */
  async addPantryItems(userId: string, items: PantryItemCreate[], spaceId?: string): Promise<PantryItem[]> {
    try {
      const itemsToInsert = items.map(item => ({
        user_id: userId,
        space_id: spaceId || null,
        name: item.name.trim(),
        quantity: item.quantity?.trim() || null,
        storage_type: item.storage_type,
        is_staple: item.is_staple || false
      }));

      const { data, error } = await supabase
        .from('pantry_items' as any)
        .insert(itemsToInsert)
        .select();

      if (error) {
        console.error('Error adding pantry items:', error);
        throw error;
      }

      return (data || []) as unknown as PantryItem[];
    } catch (error) {
      console.error('Failed to add pantry items:', error);
      throw error;
    }
  }

  /**
   * Update a pantry item
   */
  async updatePantryItem(itemId: string, updates: PantryItemUpdate): Promise<PantryItem> {
    try {
      const updateData: any = { ...updates };
      
      // Trim string fields if they exist
      if (updateData.name) {
        updateData.name = updateData.name.trim();
      }
      if (updateData.quantity) {
        updateData.quantity = updateData.quantity.trim();
      }

      const { data, error } = await supabase
        .from('pantry_items' as any)
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating pantry item:', error);
        throw error;
      }

      return data as unknown as PantryItem;
    } catch (error) {
      console.error('Failed to update pantry item:', error);
      throw error;
    }
  }

  /**
   * Delete a pantry item
   */
  async deletePantryItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pantry_items' as any)
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting pantry item:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete pantry item:', error);
      throw error;
    }
  }

  /**
   * Get pantry items suitable for AI recipe generation
   * Returns items grouped by storage type with prioritization logic
   */
  async getPantryItemsForAI(userId: string, spaceId?: string): Promise<{
    fresh: PantryItem[];  // fridge, produce
    staples: PantryItem[]; // pantry, spice
    frozen: PantryItem[];  // freezer
  }> {
    const items = await this.getPantryItems(userId, spaceId);
    
    return {
      fresh: items.filter(item => ['fridge', 'produce'].includes(item.storage_type)),
      staples: items.filter(item => ['pantry', 'spice'].includes(item.storage_type)),
      frozen: items.filter(item => item.storage_type === 'freezer')
    };
  }

  /**
   * Search pantry items by name
   */
  async searchPantryItems(userId: string, searchTerm: string, spaceId?: string): Promise<PantryItem[]> {
    try {
      let query = supabase
        .from('pantry_items' as any)
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (spaceId) {
        query = query.eq('space_id', spaceId);
      } else {
        query = query.is('space_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching pantry items:', error);
        throw error;
      }

      return (data || []) as unknown as PantryItem[];
    } catch (error) {
      console.error('Failed to search pantry items:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pantryService = new PantryService();
