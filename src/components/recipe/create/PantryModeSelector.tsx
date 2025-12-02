import React, { useState, useEffect } from 'react';
import { PantryMode, PantryItem } from '@/types';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Thermometer, 
  Snowflake, 
  Leaf, 
  Info,
  ChefHat
} from 'lucide-react';
import PantryItemSelector from './PantryItemSelector';

interface PantryModeSelectorProps {
  usePantry: boolean;
  pantryMode: PantryMode;
  pantryItems?: PantryItem[];
  selectedPantryItemIds?: Map<string, 'required' | 'optional'>;
  onUsePantryChange: (enabled: boolean) => void;
  onPantryModeChange: (mode: PantryMode) => void;
  onSelectionChange?: (selectedMap: Map<string, 'required' | 'optional'>) => void;
}

const pantryModeDescriptions = {
  ignore: {
    title: "Don't Use Pantry",
    description: "Generate recipes without considering your pantry items",
    icon: ChefHat,
    color: "text-gray-600"
  },
  strict_pantry: {
    title: "Strict Pantry",
    description: "Use ONLY your pantry items (plus basic staples like oil, salt, water)",
    icon: Package,
    color: "text-red-600"
  },
  mostly_pantry: {
    title: "Mostly Pantry",
    description: "Prioritize your pantry items, allow 2-3 additional ingredients",
    icon: Thermometer,
    color: "text-orange-600"
  },
  pantry_plus_fresh: {
    title: "Pantry + Fresh",
    description: "Use dry goods/spices from pantry, suggest fresh produce/meat as needed",
    icon: Leaf,
    color: "text-green-600"
  },
  custom_selection: {
    title: "Custom Selection",
    description: "Choose specific ingredients from your pantry to use",
    icon: ChefHat,
    color: "text-blue-600"
  }
};

const storageTypeIcons = {
  pantry: Package,
  fridge: Thermometer,
  freezer: Snowflake,
  produce: Leaf,
  spice: Package
};

const PantryModeSelector: React.FC<PantryModeSelectorProps> = ({
  usePantry,
  pantryMode,
  pantryItems = [],
  selectedPantryItemIds = new Map(),
  onUsePantryChange,
  onPantryModeChange,
  onSelectionChange
}) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Auto-open selector when custom_selection mode is selected
  useEffect(() => {
    if (pantryMode === 'custom_selection' && !isSelectorOpen) {
      setIsSelectorOpen(true);
    }
  }, [pantryMode, isSelectorOpen]);

  // Count items by storage type
  const itemCounts = pantryItems.reduce((acc, item) => {
    acc[item.storage_type] = ( acc[item.storage_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalItems = pantryItems.length;

  const handleModeChange = (value: string) => {
    onPantryModeChange(value as PantryMode);
  };

  const handleSelectionChange = (selectedMap: Map<string, 'required' | 'optional'>) => {
    onSelectionChange?.(selectedMap);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pantry Settings
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="use-pantry"
              checked={usePantry}
              onCheckedChange={onUsePantryChange}
            />
            <Label htmlFor="use-pantry" className="text-sm">
              Use My Pantry
            </Label>
          </div>
        </div>
      </CardHeader>
      
      {usePantry && (
        <CardContent className="space-y-4">
          {/* Pantry Summary */}
          {totalItems > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded">
              <Info className="h-4 w-4" />
              <span>You have {totalItems} items in your pantry:</span>
              <div className="flex gap-1">
                {Object.entries(storageTypeIcons).map(([type, Icon]) => {
                  const count = itemCounts[type] || 0;
                  if (count === 0) return null;
                  return (
                    <Badge key={type} variant="secondary" className="text-xs">
                      <Icon className="h-3 w-3 mr-1" />
                      {count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {totalItems === 0 && (
            <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Your pantry is empty. Add items in your Profile to use this feature.</span>
            </div>
          )}

          {/* Pantry Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Recipe Generation Mode</Label>
            <RadioGroup value={pantryMode} onValueChange={handleModeChange}>
              {Object.entries(pantryModeDescriptions).map(([mode, config]) => {
                const Icon = config.icon;
                return (
                  <div key={mode} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={mode} id={mode} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={mode} className="flex items-center gap-2 font-medium cursor-pointer">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        {config.title}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Mode-specific hints */}
          {pantryMode === 'strict_pantry' && totalItems > 0 && (
            <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
              💡 Tip: This mode is perfect for using up what you have before grocery shopping.
            </div>
          )}
          
          {pantryMode === 'mostly_pantry' && totalItems > 0 && (
            <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
              💡 Tip: Great for when you have most ingredients but might need 1-2 extras to complete the dish.
            </div>
          )}
          
          {pantryMode === 'pantry_plus_fresh' && totalItems > 0 && (
            <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
              💡 Tip: Perfect for when you have staples but want to add fresh ingredients for better flavor.
            </div>
          )}

          {/* Custom Selection Mode - Ingredient Selector */}
          {pantryMode === 'custom_selection' && (
            <div className="space-y-3">
              {selectedPantryItemIds.size === 0 && (
                <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>* Please select at least one ingredient to generate a recipe</span>
                </div>
              )}
              
              <PantryItemSelector
                pantryItems={pantryItems}
                selectedItems={selectedPantryItemIds}
                onSelectionChange={handleSelectionChange}
                isOpen={isSelectorOpen}
                onOpenChange={setIsSelectorOpen}
              />
              
              {selectedPantryItemIds.size > 0 && (
                <div className="text-xs text-green-600 p-2 bg-green-50 rounded">
                  ✅ {selectedPantryItemIds.size} ingredient{selectedPantryItemIds.size > 1 ? 's' : ''} selected - ready to generate!
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PantryModeSelector;
