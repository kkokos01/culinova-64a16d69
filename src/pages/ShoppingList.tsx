import React from 'react';
import { ShoppingListManager } from '@/components/shopping/ShoppingListManager';

export default function ShoppingList() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <ShoppingListManager />
      </div>
    </div>
  );
}
