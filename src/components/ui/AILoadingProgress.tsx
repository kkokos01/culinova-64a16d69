import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AILoadingProgressProps {
  isLoading: boolean;
  message: string;
  className?: string;
  floating?: boolean;
  large?: boolean;
}

const AILoadingProgress: React.FC<AILoadingProgressProps> = ({
  isLoading,
  message,
  className = "",
  floating = false,
  large = false
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
    <div className={`
      ${floating ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-6' : 'flex items-center justify-center'}
      ${className}
    `}>
      <div className={`flex flex-col items-center text-sage-800 ${large ? 'scale-125' : ''}`}>
        <Loader2 className={`mb-3 ${large ? 'h-10 w-10' : 'h-6 w-6'} animate-spin`} />
        <span className={`font-medium ${large ? 'text-lg' : 'text-sm'}`}>{message}</span>
        <span className={`text-sage-600 mt-2 italic ${large ? 'text-base' : 'text-xs'}`}>
          {chefSteps[currentStep]}
        </span>
      </div>
    </div>
  );
};

export default AILoadingProgress;
