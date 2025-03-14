
import { useState } from "react";
import { PlusCircle, MinusCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface IngredientInputProps {
  onIngredientsChange: (ingredients: { amount: number; unit: string; name: string }[]) => void;
  className?: string;
}

const UNITS = [
  "g", "kg", "lb", "oz", "cup", "tbsp", "tsp", "ml", "l", "pinch", "piece", "slice"
];

const IngredientInput = ({ onIngredientsChange, className }: IngredientInputProps) => {
  const [ingredients, setIngredients] = useState([
    { amount: 1, unit: "g", name: "" }
  ]);
  
  const handleAddIngredient = () => {
    const newIngredients = [...ingredients, { amount: 1, unit: "g", name: "" }];
    setIngredients(newIngredients);
    onIngredientsChange(newIngredients);
  };
  
  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length === 1) return;
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
    onIngredientsChange(newIngredients);
  };
  
  const handleIngredientChange = (index: number, field: string, value: string | number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { 
      ...newIngredients[index], 
      [field]: field === 'amount' ? parseFloat(value as string) || 0 : value 
    };
    setIngredients(newIngredients);
    onIngredientsChange(newIngredients);
  };
  
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-md font-medium text-slate-800">Ingredients</h3>
      
      {ingredients.map((ingredient, index) => (
        <div 
          key={index} 
          className="flex flex-wrap items-center gap-2 group animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center w-24">
            <Input
              type="number"
              min="0"
              step="0.25"
              value={ingredient.amount.toString()}
              onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
              className="w-full"
              placeholder="Amount"
            />
          </div>
          
          <div className="w-24">
            <Select
              value={ingredient.unit}
              onValueChange={(value) => handleIngredientChange(index, 'unit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Input
              value={ingredient.name}
              onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              placeholder="Ingredient name"
              className="w-full"
            />
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveIngredient(index)}
            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove ingredient"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddIngredient}
        className="mt-2 text-sage-600 border-sage-200 hover:bg-sage-50 hover:text-sage-700"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add ingredient
      </Button>
    </div>
  );
};

export default IngredientInput;
