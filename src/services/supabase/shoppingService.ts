import { supabase } from '@/integrations/supabase/client';
import { ShoppingItem, ShoppingItemCreate, ShoppingItemUpdate } from '@/types';

/**
 * Shopping List Service
 * Handles all shopping list operations with space-based access control
 */

export const shoppingService = {
  /**
   * Get all shopping list items for a user in a specific space
   * Ordered by: unchecked items first, then by category, then by name
   */
  async getItems(userId: string, spaceId?: string): Promise<ShoppingItem[]> {
    try {
      let query = supabase
        .from('shopping_list_items' as any)
        .select('*')
        .eq('user_id', userId)
        .order('is_checked', { ascending: true })
        .order('category', { ascending: true })
        .order('name', { ascending: true }) as any;

      // Filter by space if provided, otherwise get items without space_id
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      } else {
        query = query.is('space_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ShoppingItem[];
    } catch (error) {
      console.error('Error fetching shopping list items:', error);
      throw error;
    }
  },

  /**
   * Add multiple items to shopping list with upsert logic
   * If an item with the same name already exists, it will be updated
   */
  async addItems(
    userId: string, 
    spaceId: string | undefined, 
    items: ShoppingItemCreate[]
  ): Promise<ShoppingItem[]> {
    try {
      // Prepare items with user_id and space_id
      const itemsToInsert = items.map(item => ({
        ...item,
        user_id: userId,
        space_id: spaceId || null,
      }));

      // Use upsert to handle duplicates gracefully
      const { data, error } = await (supabase
        .from('shopping_list_items' as any)
        .upsert(itemsToInsert, {
          onConflict: 'user_id,space_id,name',
          ignoreDuplicates: false,
        })
        .select() as any);

      if (error) {
        // Handle unique constraint violations gracefully
        if (error.code === '23505') {
          console.warn('Duplicate items detected, updating existing items');
          // Fallback: try to update items one by one
          return await this.addItemsOneByOne(userId, spaceId, items);
        }
        throw error;
      }

      return data as ShoppingItem[];
    } catch (error) {
      console.error('Error adding shopping list items:', error);
      throw error;
    }
  },

  /**
   * Fallback method to add items one by one if bulk upsert fails
   */
  async addItemsOneByOne(
    userId: string, 
    spaceId: string | undefined, 
    items: ShoppingItemCreate[]
  ): Promise<ShoppingItem[]> {
    const results: ShoppingItem[] = [];
    
    for (const item of items) {
      try {
        const result = await this.addSingleItem(userId, spaceId, item);
        if (result) results.push(result);
      } catch (error) {
        console.error(`Failed to add item "${item.name}":`, error);
        // Continue with other items even if one fails
      }
    }
    
    return results;
  },

  /**
   * Add a single item with upsert logic
   */
  async addSingleItem(
    userId: string, 
    spaceId: string | undefined, 
    item: ShoppingItemCreate
  ): Promise<ShoppingItem | null> {
    try {
      const itemToInsert = {
        ...item,
        user_id: userId,
        space_id: spaceId || null,
      };

      const { data, error } = await supabase
        .from('shopping_list_items' as any)
        .upsert(itemToInsert, {
          onConflict: 'user_id,space_id,name',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ShoppingItem;
    } catch (error) {
      console.error(`Error adding item "${item.name}":`, error);
      return null;
    }
  },

  /**
   * Toggle item checked status
   */
  async toggleItem(itemId: string, isChecked: boolean): Promise<ShoppingItem> {
    try {
      const { data, error } = await (supabase
        .from('shopping_list_items' as any)
        .update({ 
          is_checked: isChecked,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single() as any);

      if (error) throw error;
      return data as ShoppingItem;
    } catch (error) {
      console.error('Error toggling item:', error);
      throw error;
    }
  },

  /**
   * Update an item (name, quantity, category, etc.)
   */
  async updateItem(itemId: string, updates: ShoppingItemUpdate): Promise<ShoppingItem> {
    try {
      const { data, error } = await (supabase
        .from('shopping_list_items' as any)
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single() as any);

      if (error) throw error;
      return data as ShoppingItem;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      const { error } = await (supabase
        .from('shopping_list_items' as any)
        .delete()
        .eq('id', itemId) as any);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  /**
   * Clear all completed items for a user in a specific space
   */
  async clearCompleted(userId: string, spaceId?: string): Promise<void> {
    try {
      let query = supabase
        .from('shopping_list_items' as any)
        .delete()
        .eq('user_id', userId)
        .eq('is_checked', true) as any;

      // Filter by space if provided
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      } else {
        query = query.is('space_id', null);
      }

      const { error } = await query;

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing completed items:', error);
      throw error;
    }
  },

  /**
   * Get count of unchecked items for a user in a specific space
   */
  async getUncheckedCount(userId: string, spaceId?: string): Promise<number> {
    try {
      let query = supabase
        .from('shopping_list_items' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_checked', false) as any;

      // Filter by space if provided
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      } else {
        query = query.is('space_id', null);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unchecked count:', error);
      return 0;
    }
  },
};
