import React from 'react';
import { Clock, ChefHat, Flame, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

const FilterChip = ({ label, icon, isActive, onClick }: FilterChipProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        "border hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2",
        isActive
          ? "bg-sage-500 text-white border-sage-500"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
};

interface QuickFilterChipsProps {
  activeFilter?: string;
  onFilterChange: (filter: string) => void;
}

const QuickFilterChips = ({ activeFilter, onFilterChange }: QuickFilterChipsProps) => {
  const filters = [
    {
      id: 'quick',
      label: 'Under 30 mins',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'easy',
      label: 'Easy',
      icon: <ChefHat className="h-4 w-4" />
    },
    {
      id: 'healthy',
      label: 'Healthy',
      icon: <Leaf className="h-4 w-4" />
    },
    {
      id: 'spicy',
      label: 'Spicy',
      icon: <Flame className="h-4 w-4" />
    }
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          icon={filter.icon}
          isActive={activeFilter === filter.id}
          onClick={() => onFilterChange(activeFilter === filter.id ? '' : filter.id)}
        />
      ))}
    </div>
  );
};

export default QuickFilterChips;
