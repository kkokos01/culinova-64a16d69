import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick?: () => void;
  to?: string;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
}

const FloatingActionButton = ({ 
  onClick,
  to,
  className, 
  icon = <Plus className="h-5 w-5" />,
  label 
}: FloatingActionButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-40 md:bottom-6 md:right-6", className)}>
      <Button
        onClick={handleClick}
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-sage-500 hover:bg-sage-600 text-white",
          "focus:outline-none focus:ring-4 focus:ring-sage-200",
          "hover:scale-110 active:scale-95"
        )}
        aria-label={label || "Create new recipe"}
      >
        {icon}
      </Button>
      {label && (
        <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-800 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </div>
      )}
    </div>
  );
};

export default FloatingActionButton;
