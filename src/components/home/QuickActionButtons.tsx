import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChefHat, 
  BookOpen, 
  Database, 
  Bookmark,
  Plus,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActionButtonProps {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const ActionButton = ({ to, label, description, icon, isActive }: ActionButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant={isActive ? "default" : "outline"}
            className={cn(
              "w-full h-10 justify-start gap-3 bg-gradient-to-r from-sage-50 to-slate-50 hover:from-sage-100 hover:to-slate-100 border-sage-300 text-slate-700 shadow-sm hover:shadow-md transition-all duration-200",
              isActive && "bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white border-sage-500 shadow-md"
            )}
          >
            <Link to={to} className="flex items-center w-full">
              {icon}
              <span className="font-medium">{label}</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface QuickActionButtonsProps {
  activeAction?: string;
  onActionChange?: (action: string) => void;
}

const QuickActionButtons = ({ activeAction, onActionChange }: QuickActionButtonsProps) => {
  const actions = [
    {
      id: 'create',
      label: 'Create Recipe',
      description: 'Create a recipe based on your ideas or parameters with AI',
      icon: <Plus className="h-4 w-4" />,
      to: '/create'
    },
    {
      id: 'import',
      label: 'Import Recipe',
      description: 'Import recipes from URLs or other sources',
      icon: <Database className="h-4 w-4" />,
      to: '/import'
    },
    {
      id: 'collections',
      label: 'My Collections',
      description: 'View and manage your recipe collections',
      icon: <Bookmark className="h-4 w-4" />,
      to: '/collections'
    },
    {
      id: 'inspiration',
      label: 'Get Inspiration',
      description: 'Browse public collections for recipe ideas and inspiration',
      icon: <Lightbulb className="h-4 w-4" />,
      to: '/publiccollections'
    }
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      {actions.map((action) => (
        <ActionButton
          key={action.id}
          to={action.to}
          label={action.label}
          description={action.description}
          icon={action.icon}
          isActive={activeAction === action.id}
        />
      ))}
    </div>
  );
};

export default QuickActionButtons;
