import React, { useState } from 'react';
import { PantryItem, StorageType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Package, 
  Thermometer, 
  Snowflake, 
  Leaf
} from 'lucide-react';

interface PantryItemSelectorProps {
  pantryItems: PantryItem[];
  selectedItems: Map<string, 'required' | 'optional'>;
  onSelectionChange: (selectedMap: Map<string, 'required' | 'optional'>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const storageTypeConfig = {
  pantry: { icon: Package, label: 'Pantry', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  fridge: { icon: Thermometer, label: 'Fridge', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  freezer: { icon: Snowflake, label: 'Freezer', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  produce: { icon: Leaf, label: 'Produce', color: 'bg-green-100 text-green-800 border-green-200' },
  spice: { icon: Package, label: 'Spices', color: 'bg-red-100 text-red-800 border-red-200' }
};

const PantryItemSelector: React.FC<PantryItemSelectorProps> = ({
  pantryItems,
  selectedItems,
  onSelectionChange,
  isOpen,
  onOpenChange
}) => {
  // Group items by storage type
  const groupedItems = pantryItems.reduce((acc, item) => {
    if (!acc[item.storage_type]) {
      acc[item.storage_type] = [];
    }
    acc[item.storage_type].push(item);
    return acc;
  }, {} as Record<StorageType, PantryItem[]>);

  const handleItemClick = (itemId: string) => {
    const newSelectedMap = new Map(selectedItems);
    const currentState = newSelectedMap.get(itemId);
    
    if (!currentState) {
      // Unselected -> Required
      newSelectedMap.set(itemId, 'required');
    } else if (currentState === 'required') {
      // Required -> Optional
      newSelectedMap.set(itemId, 'optional');
    } else {
      // Optional -> Unselected
      newSelectedMap.delete(itemId);
    }
    
    onSelectionChange(newSelectedMap);
  };

  const handleSelectAll = (storageType: StorageType, state: 'required' | 'optional') => {
    const itemsInType = groupedItems[storageType] || [];
    const newSelectedMap = new Map(selectedItems);
    
    itemsInType.forEach(item => {
      newSelectedMap.set(item.id, state);
    });
    
    onSelectionChange(newSelectedMap);
  };

  const handleDeselectAll = (storageType: StorageType) => {
    const itemsInType = groupedItems[storageType] || [];
    const newSelectedMap = new Map(selectedItems);
    
    itemsInType.forEach(item => {
      newSelectedMap.delete(item.id);
    });
    
    onSelectionChange(newSelectedMap);
  };

  const getSelectedCount = (storageType: StorageType, state?: 'required' | 'optional') => {
    const itemsInType = groupedItems[storageType] || [];
    return itemsInType.filter(item => {
      const itemState = selectedItems.get(item.id);
      return state ? itemState === state : itemState !== undefined;
    }).length;
  };

  const getTotalSelectedCount = () => selectedItems.size;

  const getStateConfig = (state: 'required' | 'optional') => {
    return state === 'required' 
      ? { badge: 'R', color: 'bg-red-500 text-white border-red-500', textColor: 'text-red-600' }
      : { badge: 'O', color: 'bg-green-500 text-white border-green-500', textColor: 'text-green-600' };
  };

  return (
    <div className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-auto py-3 px-4 bg-white border-gray-200 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Select Ingredients</span>
              <Badge variant="secondary" className="text-xs">
                {getTotalSelectedCount()} selected
              </Badge>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 mt-3">
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600 bg-gray-50 rounded p-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 text-white rounded flex items-center justify-center font-bold text-xs">R</div>
              <span>= Required (must include)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500 text-white rounded flex items-center justify-center font-bold text-xs">O</div>
              <span>= Optional (nice to include)</span>
            </div>
          </div>

          {Object.entries(groupedItems).map(([storageType, items]) => {
            const config = storageTypeConfig[storageType as StorageType];
            const Icon = config.icon;
            const requiredCount = getSelectedCount(storageType as StorageType, 'required');
            const optionalCount = getSelectedCount(storageType as StorageType, 'optional');
            const totalCount = items.length;

            if (items.length === 0) return null;

            return (
              <div key={storageType} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {requiredCount}R + {optionalCount}O / {totalCount}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAll(storageType as StorageType, 'required')}
                      className="text-xs h-7 px-2 text-red-600 hover:bg-red-50"
                    >
                      All R
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAll(storageType as StorageType, 'optional')}
                      className="text-xs h-7 px-2 text-green-600 hover:bg-green-50"
                    >
                      All O
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeselectAll(storageType as StorageType)}
                      className="text-xs h-7 px-2"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => {
                    const itemState = selectedItems.get(item.id);
                    const stateConfig = itemState ? getStateConfig(itemState) : null;
                    
                    return (
                      <Badge
                        key={item.id}
                        variant="outline"
                        className={`cursor-pointer px-3 py-1 text-sm transition-all hover:scale-105 relative ${
                          itemState 
                            ? stateConfig!.color
                            : config.color
                        }`}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{item.name}</span>
                          {item.quantity && (
                            <span className="text-xs opacity-75">({item.quantity})</span>
                          )}
                          {itemState && (
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-xs ${
                              itemState === 'required' ? 'bg-red-600' : 'bg-green-600'
                            }`}>
                              {itemState === 'required' ? 'R' : 'O'}
                            </div>
                          )}
                        </div>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {pantryItems.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No pantry items available. Add items in your Profile to use custom selection.
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PantryItemSelector;
