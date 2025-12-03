import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSpace } from '@/context/SpaceContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingItem, ShoppingCategory, ShoppingItemCreate, ShoppingItemUpdate } from '@/types';
import { shoppingService } from '@/services/supabase/shoppingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  ShoppingCart,
  AlertCircle
} from 'lucide-react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Fixed category order for consistent UI
const CATEGORY_ORDER: ShoppingCategory[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs', 
  'Bakery',
  'Pantry',
  'Spices',
  'Beverages',
  'Frozen',
  'Other'
];

// Category colors for visual distinction
const CATEGORY_COLORS: Record<ShoppingCategory, string> = {
  'Produce': 'bg-green-100 text-green-800 border-green-200',
  'Meat & Seafood': 'bg-red-100 text-red-800 border-red-200',
  'Dairy & Eggs': 'bg-blue-100 text-blue-800 border-blue-200',
  'Bakery': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Pantry': 'bg-orange-100 text-orange-800 border-orange-200',
  'Spices': 'bg-purple-100 text-purple-800 border-purple-200',
  'Beverages': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Frozen': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Other': 'bg-gray-100 text-gray-800 border-gray-200',
};

interface ShoppingListManagerProps {
  className?: string;
}

export function ShoppingListManager({ className }: ShoppingListManagerProps) {
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ShoppingCategory>('Other');
  const [addingItem, setAddingItem] = useState(false);

  // Debounce form inputs to prevent rapid submissions
  const debouncedItemName = useDebounce(newItemName, 300);
  const debouncedQuantity = useDebounce(newItemQuantity, 300);

  // Load shopping list items
  const loadItems = async () => {
    if (!user?.id || !currentSpace?.id) return;
    
    try {
      setLoading(true);
      const shoppingItems = await shoppingService.getItems(user.id, currentSpace.id);
      setItems(shoppingItems);
    } catch (error: any) {
      console.error('Error loading shopping list:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shopping list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add new item with optimistic update
  const handleAddItem = async () => {
    if (!user?.id || !currentSpace?.id || !debouncedItemName.trim()) return;

    try {
      setAddingItem(true);
      
      const newItem: ShoppingItemCreate = {
        name: debouncedItemName.trim(),
        quantity: debouncedQuantity.trim() || undefined,
        category: newItemCategory,
      };

      // Optimistic update - add to local state immediately
      const optimisticItem: ShoppingItem = {
        id: crypto.randomUUID(), // More robust temporary ID
        user_id: user.id,
        space_id: currentSpace.id,
        name: newItem.name,
        quantity: newItem.quantity,
        category: newItem.category,
        is_checked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setItems(prev => [...prev, optimisticItem]);
      
      // Reset form immediately
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemCategory('Other');
      
      // Actually add to database
      const result = await shoppingService.addItems(user.id, currentSpace.id, [newItem]);
      
      // Replace optimistic item with real data
      if (result.length > 0) {
        setItems(prev => 
          prev.map(item => 
            item.id === optimisticItem.id ? result[0] : item
          )
        );
      }
      
      toast({
        title: 'Item added',
        description: `${newItem.name} added to shopping list`,
      });
    } catch (error: any) {
      console.error('Error adding item:', error);
      // Revert optimistic update on error
      await loadItems(); // Reload to clean state
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item',
        variant: 'destructive',
      });
    } finally {
      setAddingItem(false);
    }
  };

  // Toggle item checked status
  const handleToggleItem = async (itemId: string, isChecked: boolean) => {
    if (!user?.id) return;

    try {
      await shoppingService.toggleItem(itemId, isChecked);
      
      // Update local state
      setItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, is_checked: isChecked } : item
        )
      );
    } catch (error: any) {
      console.error('Error toggling item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!user?.id) return;

    try {
      await shoppingService.deleteItem(itemId);
      
      // Update local state
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: 'Item deleted',
        description: 'Item removed from shopping list',
      });
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  // Clear completed items
  const handleClearCompleted = async () => {
    if (!user?.id || !currentSpace?.id) return;

    const completedItems = items.filter(item => item.is_checked);
    if (completedItems.length === 0) return;

    try {
      await shoppingService.clearCompleted(user.id, currentSpace.id);
      
      // Update local state
      setItems(prev => prev.filter(item => !item.is_checked));
      
      toast({
        title: 'Completed items cleared',
        description: `${completedItems.length} item(s) removed`,
      });
    } catch (error: any) {
      console.error('Error clearing completed items:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear completed items',
        variant: 'destructive',
      });
    }
  };

  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<ShoppingCategory, ShoppingItem[]>);

  // Sort categories by fixed order
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    return CATEGORY_ORDER.indexOf(a as ShoppingCategory) - CATEGORY_ORDER.indexOf(b as ShoppingCategory);
  });

  // Count unchecked items
  const uncheckedCount = items.filter(item => !item.is_checked).length;

  useEffect(() => {
    loadItems();
  }, [user?.id, currentSpace?.id]);

  if (!user?.id || !currentSpace?.id) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Please select a space to view shopping list</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping List
            {uncheckedCount > 0 && (
              <Badge variant="secondary">{uncheckedCount}</Badge>
            )}
          </CardTitle>
          
          {items.some(item => item.is_checked) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCompleted}
            >
              Clear Completed
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add new item form */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Add Item</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              className="flex-1"
            />
            <Input
              placeholder="Quantity (optional)"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              className="w-32"
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as ShoppingCategory)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              {CATEGORY_ORDER.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Button
              onClick={handleAddItem}
              disabled={!debouncedItemName.trim() || addingItem}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Shopping list items grouped by category */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading shopping list...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Your shopping list is empty</p>
            <p className="text-sm text-muted-foreground">Add items above or generate from a recipe</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((category) => {
              const categoryItems = groupedItems[category as ShoppingCategory];
              const checkedCount = categoryItems.filter(item => item.is_checked).length;
              
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={CATEGORY_COLORS[category as ShoppingCategory]}
                      >
                        {category}
                      </Badge>
                      <span className="text-muted-foreground">
                        ({categoryItems.length - checkedCount} remaining)
                      </span>
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          item.is_checked 
                            ? 'bg-muted/50 border-muted' 
                            : 'bg-background border-border hover:bg-muted/20'
                        }`}
                      >
                        <Checkbox
                          checked={item.is_checked}
                          onCheckedChange={(checked) => 
                            handleToggleItem(item.id, checked as boolean)
                          }
                          aria-label={`Mark ${item.name} as ${item.is_checked ? 'incomplete' : 'complete'}`}
                        />
                        
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 ${
                            item.is_checked ? 'line-through text-muted-foreground' : ''
                          }`}>
                            <span className="font-medium">{item.name}</span>
                            {item.quantity && (
                              <span className="text-sm text-muted-foreground">
                                ({item.quantity})
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="opacity-60 hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
