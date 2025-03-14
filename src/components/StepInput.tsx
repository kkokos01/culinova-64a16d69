
import { useState } from "react";
import { PlusCircle, X, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface StepInputProps {
  onStepsChange: (steps: { order_number: number; instruction: string; duration_minutes?: number }[]) => void;
  className?: string;
}

const StepInput = ({ onStepsChange, className }: StepInputProps) => {
  const [steps, setSteps] = useState([
    { order_number: 1, instruction: "", duration_minutes: undefined as number | undefined }
  ]);
  
  const handleAddStep = () => {
    const newSteps = [
      ...steps, 
      { 
        order_number: steps.length + 1, 
        instruction: "", 
        duration_minutes: undefined 
      }
    ];
    setSteps(newSteps);
    onStepsChange(newSteps);
  };
  
  const handleRemoveStep = (index: number) => {
    if (steps.length === 1) return;
    const newSteps = steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, order_number: i + 1 }));
    setSteps(newSteps);
    onStepsChange(newSteps);
  };
  
  const handleStepChange = (index: number, field: string, value: string | number) => {
    const newSteps = [...steps];
    if (field === 'duration_minutes') {
      const duration = value === '' ? undefined : parseFloat(value as string) || 0;
      newSteps[index] = { ...newSteps[index], [field]: duration };
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value };
    }
    setSteps(newSteps);
    onStepsChange(newSteps);
  };
  
  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }
    
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the steps
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update order numbers
    newSteps.forEach((step, i) => {
      step.order_number = i + 1;
    });
    
    setSteps(newSteps);
    onStepsChange(newSteps);
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="text-md font-medium text-slate-800">Instructions</h3>
      
      {steps.map((step, index) => (
        <div 
          key={index} 
          className="relative p-4 border border-slate-200 rounded-lg group animate-fade-in bg-white"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-medium text-sm mr-3">
                {step.order_number}
              </span>
              <h4 className="text-sm font-medium text-slate-700">Step {step.order_number}</h4>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveStep(index, 'up')}
                disabled={index === 0}
                className="h-8 w-8 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                aria-label="Move step up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveStep(index, 'down')}
                disabled={index === steps.length - 1}
                className="h-8 w-8 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                aria-label="Move step down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveStep(index)}
                className="h-8 w-8 text-slate-400 hover:text-red-500"
                aria-label="Remove step"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Textarea
            value={step.instruction}
            onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
            placeholder={`Describe step ${step.order_number} of your recipe...`}
            className="mb-3 min-h-24 resize-none"
          />
          
          <div className="flex items-center text-sm text-slate-500">
            <Clock className="h-4 w-4 mr-2" />
            <span className="mr-2">Duration (optional):</span>
            <Input
              type="number"
              min="0"
              value={step.duration_minutes === undefined ? '' : step.duration_minutes}
              onChange={(e) => handleStepChange(index, 'duration_minutes', e.target.value)}
              placeholder="Minutes"
              className="w-24 h-8 text-sm"
            />
            <span className="ml-2">minutes</span>
          </div>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        onClick={handleAddStep}
        className="mt-4 text-sage-600 border-sage-200 hover:bg-sage-50 hover:text-sage-700"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add step
      </Button>
    </div>
  );
};

export default StepInput;
