import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSpace } from '@/context/SpaceContext';
import { useToast } from '@/hooks/use-toast';
import { pantryService } from '@/services/pantry/pantryService';
import { PantryItem, PantryItemCreate, StorageType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Trash2, 
  Package, 
  Snowflake, 
  Thermometer, 
  Leaf,
  Save,
  Loader2
} from 'lucide-react';

interface PantryItemFormData {
  id?: string;
  name: string;
  quantity: string;
  storage_type: StorageType;
  is_staple: boolean;
}

const storageTypeConfig = {
  pantry: { icon: Package, label: 'Pantry', color: 'bg-amber-100 text-amber-800' },
  fridge: { icon: Thermometer, label: 'Fridge', color: 'bg-blue-100 text-blue-800' },
  freezer: { icon: Snowflake, label: 'Freezer', color: 'bg-cyan-100 text-cyan-800' },
  produce: { icon: Leaf, label: 'Produce', color: 'bg-green-100 text-green-800' },
  spice: { icon: Package, label: 'Spices', color: 'bg-red-100 text-red-800' }
};

const PantryManager: React.FC = () => {
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const { toast } = useToast();

  // State
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStorageType, setActiveStorageType] = useState<StorageType>('pantry');
  const [pendingItems, setPendingItems] = useState<PantryItemFormData[]>([]);
  const [newItem, setNewItem] = useState<PantryItemFormData>({
    name: '',
    quantity: '',
    storage_type: 'pantry',
    is_staple: false
  });

  // Load pantry items
  const loadPantryItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const items = await pantryService.getPantryItems(user.id, currentSpace?.id);
      setPantryItems(items);
    } catch (error) {
      console.error('Error loading pantry items:', error);
      toast({
        title: "Error",
        description: "Failed to load pantry items",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPantryItems();
  }, [user, currentSpace]);

  // Add new item to pending list
  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter an item name",
        variant: "destructive"
      });
      return;
    }

    const itemToAdd: PantryItemFormData = {
      ...newItem,
      name: newItem.name.trim(),
      quantity: newItem.quantity.trim()
    };

    setPendingItems([...pendingItems, itemToAdd]);
    setNewItem({
      name: '',
      quantity: '',
      storage_type: newItem.storage_type,
      is_staple: false
    });
  };

  // Remove item from pending list
  const handleRemovePendingItem = (index: number) => {
    setPendingItems(pendingItems.filter((_, i) => i !== index));
  };

  // Save all pending items (batch save)
  const handleSaveItems = async () => {
    if (!user || pendingItems.length === 0) return;

    setIsSaving(true);
    try {
      const itemsToCreate: PantryItemCreate[] = pendingItems.map(item => ({
        name: item.name,
        quantity: item.quantity || undefined,
        storage_type: item.storage_type,
        is_staple: item.is_staple,
        space_id: currentSpace?.id
      }));

      const savedItems = await pantryService.addPantryItems(user.id, itemsToCreate, currentSpace?.id);
      setPantryItems([...savedItems, ...pantryItems]);
      setPendingItems([]);
      
      toast({
        title: "Success",
        description: `Added ${savedItems.length} item${savedItems.length > 1 ? 's' : ''} to pantry`,
      });
    } catch (error) {
      console.error('Error saving pantry items:', error);
      toast({
        title: "Error",
        description: "Failed to save pantry items",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete existing pantry item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await pantryService.deletePantryItem(itemId);
      setPantryItems(pantryItems.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Item removed from pantry",
      });
    } catch (error) {
      console.error('Error deleting pantry item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  // Group items by storage type
  const getItemsByStorageType = (type: StorageType) => {
    return pantryItems.filter(item => item.storage_type === type);
  };

  const getPendingItemsByStorageType = (type: StorageType) => {
    return pendingItems.filter(item => item.storage_type === type);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-pulse text-slate-500">Loading pantry items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Pantry Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Item name (e.g., Chicken Thighs)"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Input
              placeholder="Quantity (e.g., 2 lbs, 1 can)"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
            <Select
              value={newItem.storage_type}
              onValueChange={(value: StorageType) => setNewItem({ ...newItem, storage_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(storageTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_staple"
                checked={newItem.is_staple}
                onCheckedChange={(checked) => setNewItem({ ...newItem, is_staple: checked as boolean })}
              />
              <label htmlFor="is_staple" className="text-sm font-medium">
                Staple item
              </label>
              <Button onClick={handleAddItem} disabled={!newItem.name.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Items to Save ({pendingItems.length})</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingItems([])}
                    disabled={isSaving}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleSaveItems}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Items
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                {pendingItems.map((item, index) => {
                  const config = storageTypeConfig[item.storage_type];
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <span className="font-medium">{item.name}</span>
                        {item.quantity && <span className="text-sm text-gray-500">({item.quantity})</span>}
                        {item.is_staple && <Badge variant="secondary">Staple</Badge>}
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePendingItem(index)}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pantry Items by Storage Type */}
      <Card>
        <CardHeader>
          <CardTitle>My Pantry</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStorageType} onValueChange={(value) => setActiveStorageType(value as StorageType)}>
            <TabsList className="grid w-full grid-cols-5">
              {Object.entries(storageTypeConfig).map(([type, config]) => (
                <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  {config.label}
                  <Badge variant="secondary" className="ml-1">
                    {getItemsByStorageType(type as StorageType).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(storageTypeConfig).map(([type, config]) => {
              const items = getItemsByStorageType(type as StorageType);
              const pendingItems = getPendingItemsByStorageType(type as StorageType);
              
              return (
                <TabsContent key={type} value={type} className="space-y-4">
                  {items.length === 0 && pendingItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <config.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No items in {config.label.toLowerCase()}</p>
                      <p className="text-sm">Add items using the form above</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Existing items */}
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <config.icon className="h-5 w-5" />
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.quantity && <span className="text-sm text-gray-500 ml-2">({item.quantity})</span>}
                              {item.is_staple && <Badge variant="secondary" className="ml-2">Staple</Badge>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {/* Pending items for this storage type */}
                      {pendingItems.map((item, index) => {
                        const originalIndex = pendingItems.indexOf(item);
                        return (
                          <div key={`pending-${originalIndex}`} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="flex items-center gap-3">
                              <config.icon className="h-5 w-5" />
                              <div>
                                <span className="font-medium">{item.name}</span>
                                {item.quantity && <span className="text-sm text-gray-500 ml-2">({item.quantity})</span>}
                                {item.is_staple && <Badge variant="secondary" className="ml-2">Staple</Badge>}
                              </div>
                              <Badge variant="outline">Pending</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePendingItem(originalIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PantryManager;
