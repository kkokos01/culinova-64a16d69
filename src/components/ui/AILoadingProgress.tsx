import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AILoadingProgressProps {
  isLoading: boolean;
  message: string;
  className?: string;
}

const AILoadingProgress: React.FC<AILoadingProgressProps> = ({
  isLoading,
  message,
  className = ""
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Chef's narrative steps that cycle during AI generation
  const chefSteps = [
    "Chopping fresh vegetables...",
    "Sautéing aromatic onions...",
    "Selecting perfect spices...",
    "Simmering to perfection...",
    "Tasting and adjusting seasoning...",
    "Plating with care...",
    "Adding final garnishes...",
    "Almost ready..."
  ];

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % chefSteps.length);
    }, 2000); // Change every 2 seconds for better pacing

    return () => clearInterval(interval);
  }, [isLoading, chefSteps.length]);

  if (!isLoading) return null;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center text-sage-800">
        <Loader2 className="mb-2 h-6 w-6 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
        <span className="text-xs text-sage-600 mt-1 italic">
          {chefSteps[currentStep]}
        </span>
      </div>
    </div>
  );
};

export default AILoadingProgress;
