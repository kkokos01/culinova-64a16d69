import React from "react";
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
  if (!isLoading) return null;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center text-sage-800">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
};

export default AILoadingProgress;
