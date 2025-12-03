import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSpace } from '@/context/SpaceContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingItemCreate, ShoppingCategory } from '@/types';
import { shoppingService } from '@/services/supabase/shoppingService';
import { pantryService } from '@/services/pantry/pantryService';
import { shoppingGenerator } from '@/services/ai/shoppingGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Plus, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';

// Category colors matching ShoppingListManager
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

interface AddToShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: any;
}

export function AddToShoppingListModal({ 
  isOpen, 
  onClose, 
  recipe
}: AddToShoppingListModalProps) {
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<ShoppingItemCreate[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [existingItems, setExistingItems] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>('');
  const [addingItems, setAddingItems] = useState(false);
  const [pantryItems, setPantryItems] = useState<any[]>([]);

  // Extract recipe ingredients for AI processing
  const recipeIngredients = React.useMemo(() => {
    return shoppingGenerator.extractIngredientsFromRecipe(recipe);
  }, [recipe]);

  // Extract pantry items for AI processing
  const extractedPantryItems = React.useMemo(() => {
    return shoppingGenerator.extractPantryItems(pantryItems);
  }, [pantryItems]);

  // Load pantry items and existing shopping list items when modal opens
  const loadPantryAndExistingItems = async () => {
    if (!user?.id || !currentSpace?.id) return;

    try {
      // Load pantry items
      const pantryData = await pantryService.getPantryItems(user.id, currentSpace.id);
      setPantryItems(pantryData);

      // Load existing shopping list items to check for duplicates
      const shoppingItems = await shoppingService.getItems(user.id, currentSpace.id);
      const existingNames = new Set(shoppingItems.map(item => item.name.toLowerCase().trim()));
      setExistingItems(existingNames);
    } catch (error) {
      console.error('Error loading pantry and existing items:', error);
    }
  };

  // Generate shopping list using AI
  const generateShoppingList = async () => {
    if (!user?.id || !currentSpace?.id) return;

    try {
      setLoading(true);
      setMessage('');

      const result = await shoppingGenerator.generateShoppingList(
        recipeIngredients,
        extractedPantryItems,
        recipe.id
      );

      setSuggestedItems(result.items);
      setMessage(result.message || '');

      // Auto-select all items that aren't duplicates
      const nonDuplicateItems = result.items.filter(
        item => !existingItems.has(item.name.toLowerCase().trim())
      );
      setSelectedItems(new Set(nonDuplicateItems.map(item => item.name)));

    } catch (error: any) {
      console.error('Error generating shopping list:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate shopping list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemName: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  // Add selected items to shopping list
  const handleAddItems = async () => {
    if (!user?.id || !currentSpace?.id || selectedItems.size === 0) return;

    try {
      setAddingItems(true);

      const itemsToAdd = suggestedItems.filter(item => 
        selectedItems.has(item.name)
      );

      await shoppingService.addItems(user.id, currentSpace.id, itemsToAdd);

      toast({
        title: 'Items added',
        description: `${itemsToAdd.length} item(s) added to shopping list`,
      });

      onClose();
    } catch (error: any) {
      console.error('Error adding items:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add items to shopping list',
        variant: 'destructive',
      });
    } finally {
      setAddingItems(false);
    }
  };

  // Generate list when modal opens
  useEffect(() => {
    if (isOpen && user?.id && currentSpace?.id) {
      loadPantryAndExistingItems();
      generateShoppingList();
    }
  }, [isOpen, user?.id, currentSpace?.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSuggestedItems([]);
      setSelectedItems(new Set());
      setExistingItems(new Set());
      setMessage('');
      setLoading(false);
      setAddingItems(false);
    }
  }, [isOpen]);

  const hasDuplicates = suggestedItems.some(item => 
    existingItems.has(item.name.toLowerCase().trim())
  );

  const selectedCount = selectedItems.size;
  const duplicateCount = suggestedItems.filter(item => 
    existingItems.has(item.name.toLowerCase().trim())
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Add to Shopping List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipe info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-1">{recipe.title}</h3>
            <p className="text-sm text-muted-foreground">
              {recipeIngredients.length} ingredient(s) • {pantryItems.length} item(s) in pantry
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Generating shopping list...</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Sparkles className="h-3 w-3" />
                  AI is analyzing your pantry
                </p>
              </div>
            </div>
          )}

          {/* Message (e.g., all ingredients available) */}
          {message && !loading && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Suggested items */}
          {!loading && suggestedItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Suggested Items</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedCount} selected</span>
                  {hasDuplicates && (
                    <span>• {duplicateCount} already on list</span>
                  )}
                </div>
              </div>

              {/* Select all / deselect all */}
              {suggestedItems.length > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nonDuplicates = suggestedItems.filter(item => 
                        !existingItems.has(item.name.toLowerCase().trim())
                      );
                      setSelectedItems(new Set(nonDuplicates.map(item => item.name)));
                    }}
                  >
                    Select All New
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItems(new Set())}
                  >
                    Deselect All
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                {suggestedItems.map((item, index) => {
                  const isDuplicate = existingItems.has(item.name.toLowerCase().trim());
                  const isSelected = selectedItems.has(item.name);

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isDuplicate 
                          ? 'bg-muted/30 border-muted/50' 
                          : 'bg-background border-border hover:bg-muted/20'
                      } ${isSelected ? 'ring-2 ring-primary/20' : ''}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSelection(item.name)}
                        disabled={isDuplicate}
                        aria-label={`Select ${item.name} for shopping list`}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            isDuplicate ? 'text-muted-foreground line-through' : ''
                          }`}>
                            {item.name}
                          </span>
                          {item.quantity && (
                            <span className="text-sm text-muted-foreground">
                              ({item.quantity})
                            </span>
                          )}
                          <Badge 
                            variant="outline" 
                            className={CATEGORY_COLORS[item.category]}
                          >
                            {item.category}
                          </Badge>
                        </div>
                        {isDuplicate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Already on your shopping list
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No items needed */}
          {!loading && !message && suggestedItems.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No items to add</p>
              <p className="text-sm text-muted-foreground">
                All ingredients may be available in your pantry
              </p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItems}
              disabled={selectedCount === 0 || addingItems}
              className="min-w-[120px]"
            >
              {addingItems ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
