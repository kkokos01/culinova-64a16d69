import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { List, X } from 'lucide-react';
import { useRecipe } from '@/context/recipe';

interface IngredientsDrawerProps {
  children: React.ReactNode;
}

const IngredientsDrawer: React.FC<IngredientsDrawerProps> = ({ children }) => {
  const { recipe } = useRecipe();

  if (!recipe?.ingredients || recipe.ingredients.length === 0) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Ingredients
          </SheetTitle>
          <SheetDescription>
            Complete ingredient list for {recipe.title}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-6">
          <div className="space-y-4">
            {recipe.ingredients.map((ingredient, index) => (
              <div 
                key={index}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {ingredient.food_name || 'Unknown ingredient'}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {ingredient.amount && (
                    <Badge variant="secondary" className="font-mono">
                      {ingredient.amount}
                    </Badge>
                  )}
                  {ingredient.unit?.name && (
                    <Badge variant="outline" className="font-mono">
                      {ingredient.unit.name}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default IngredientsDrawer;
